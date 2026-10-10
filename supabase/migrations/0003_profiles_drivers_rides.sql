-- Base do aplicativo: perfis, motoristas, configuração de tarifa, cotações e
-- corridas. Toda tabela nasce com RLS. O client autenticado só LÊ o que é
-- dele; toda escrita em `rides` passa pelas funções de 0004_ride_rpcs.sql.

-- ---------------------------------------------------------------------------
-- profiles — 1:1 com auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null check (role in ('passageiro', 'motorista')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- drivers — extensão 1:1 de profiles para quem tem role = 'motorista'
-- ---------------------------------------------------------------------------
create table public.drivers (
  id uuid primary key references public.profiles (id) on delete cascade,
  -- Só muda pelo dashboard/service role: o motorista nunca se autoaprova.
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  is_online boolean not null default false,
  vehicle_model text,
  vehicle_plate text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger drivers_set_updated_at
  before update on public.drivers
  for each row
  execute function public.set_updated_at();

create index drivers_available_idx
  on public.drivers (id)
  where approval_status = 'approved' and is_online;

-- ---------------------------------------------------------------------------
-- Cadastro: cria profile (e driver) a partir dos metadados do signUp.
-- O papel vem do client, o que é aceitável porque ser 'motorista' não dá
-- nenhum poder até alguém aprovar em drivers.approval_status.
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'passageiro');
  v_name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
begin
  if v_role not in ('passageiro', 'motorista') then
    v_role := 'passageiro';
  end if;

  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(v_name, split_part(coalesce(new.email, 'Usuário'), '@', 1)),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    v_role
  );

  if v_role = 'motorista' then
    insert into public.drivers (id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- fare_settings — linha única com a fórmula de preço (valores em centavos).
-- Os valores abaixo são provisórios para teste; ajustar pelo dashboard.
-- ---------------------------------------------------------------------------
create table public.fare_settings (
  id boolean primary key default true check (id),
  base_cents integer not null check (base_cents >= 0),
  per_km_cents integer not null check (per_km_cents >= 0),
  per_minute_cents integer not null check (per_minute_cents >= 0),
  minimum_cents integer not null check (minimum_cents >= 0),
  updated_at timestamptz not null default now()
);

create trigger fare_settings_set_updated_at
  before update on public.fare_settings
  for each row
  execute function public.set_updated_at();

insert into public.fare_settings (base_cents, per_km_cents, per_minute_cents, minimum_cents)
values (400, 180, 30, 800);

-- ---------------------------------------------------------------------------
-- ride_quotes — estimativa calculada no servidor (Edge Function + rota real).
-- O passageiro só consegue pedir corrida a partir de uma cotação válida, então
-- distância, duração e preço nunca vêm do client.
-- ---------------------------------------------------------------------------
create table public.ride_quotes (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid not null references public.profiles (id) on delete cascade,
  origin_address text not null,
  origin_lat double precision not null check (origin_lat between -90 and 90),
  origin_lng double precision not null check (origin_lng between -180 and 180),
  destination_address text not null,
  destination_lat double precision not null check (destination_lat between -90 and 90),
  destination_lng double precision not null check (destination_lng between -180 and 180),
  distance_m integer not null check (distance_m > 0),
  duration_s integer not null check (duration_s > 0),
  price_cents integer not null check (price_cents >= 0),
  expires_at timestamptz not null default now() + interval '10 minutes',
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index ride_quotes_passenger_idx on public.ride_quotes (passenger_id, created_at desc);

-- ---------------------------------------------------------------------------
-- rides
-- ---------------------------------------------------------------------------
create table public.rides (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null unique references public.ride_quotes (id),
  passenger_id uuid not null references public.profiles (id),
  driver_id uuid references public.drivers (id),
  origin_address text not null,
  origin_lat double precision not null,
  origin_lng double precision not null,
  destination_address text not null,
  destination_lat double precision not null,
  destination_lng double precision not null,
  distance_m integer not null,
  duration_s integer not null,
  estimated_price_cents integer not null,
  status text not null default 'requested'
    check (status in ('requested', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled')),
  requested_at timestamptz not null default now(),
  accepted_at timestamptz,
  arrived_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id),
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Corrida aceita em diante sempre tem motorista; solicitada nunca tem.
  constraint rides_driver_matches_status check (
    (status = 'requested' and driver_id is null)
    or (status in ('accepted', 'arrived', 'in_progress', 'completed') and driver_id is not null)
    or status = 'cancelled'
  )
);

create trigger rides_set_updated_at
  before update on public.rides
  for each row
  execute function public.set_updated_at();

-- No máximo uma corrida ativa por passageiro e por motorista — garantido pelo
-- banco, não só pela função.
create unique index rides_one_active_per_passenger
  on public.rides (passenger_id)
  where status in ('requested', 'accepted', 'arrived', 'in_progress');

create unique index rides_one_active_per_driver
  on public.rides (driver_id)
  where status in ('accepted', 'arrived', 'in_progress');

create index rides_open_requests_idx on public.rides (requested_at) where status = 'requested';
create index rides_passenger_history_idx on public.rides (passenger_id, requested_at desc);
create index rides_driver_history_idx on public.rides (driver_id, requested_at desc);

-- ---------------------------------------------------------------------------
-- Helper usado nas policies. SECURITY DEFINER para ler `drivers` sem depender
-- da RLS de `drivers` (evita recursão entre policies).
-- ---------------------------------------------------------------------------
create function public.is_available_driver()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.drivers d
    where d.id = (select auth.uid())
      and d.approval_status = 'approved'
      and d.is_online
  );
$$;

-- ---------------------------------------------------------------------------
-- Privilégios: o padrão do Supabase dá ALL para anon/authenticated em tabelas
-- novas de `public`. Aqui zeramos e devolvemos só o necessário.
-- ---------------------------------------------------------------------------
revoke all on public.profiles, public.drivers, public.fare_settings,
  public.ride_quotes, public.rides
  from anon, authenticated;

grant select on public.profiles, public.drivers, public.ride_quotes, public.rides
  to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant update (vehicle_model, vehicle_plate) on public.drivers to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_available_driver() from public, anon;
grant execute on function public.is_available_driver() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.fare_settings enable row level security;
alter table public.ride_quotes enable row level security;
alter table public.rides enable row level security;

-- rides: o passageiro vê as suas; o motorista vê as suas e, se estiver
-- aprovado e online, as que ainda estão aguardando aceite.
create policy rides_select on public.rides
  for select to authenticated
  using (
    passenger_id = (select auth.uid())
    or driver_id = (select auth.uid())
    or (status = 'requested' and (select public.is_available_driver()))
  );

-- profiles: o próprio, e a outra parte de uma corrida já aceita (o motorista
-- precisa do nome/telefone do passageiro e vice-versa).
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.rides r
      where r.driver_id is not null
        and (
          (r.passenger_id = profiles.id and r.driver_id = (select auth.uid()))
          or (r.driver_id = profiles.id and r.passenger_id = (select auth.uid()))
        )
    )
  );

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- drivers: o próprio, e o passageiro de uma corrida com esse motorista.
create policy drivers_select on public.drivers
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.rides r
      where r.driver_id = drivers.id
        and r.passenger_id = (select auth.uid())
    )
  );

create policy drivers_update_own on public.drivers
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy ride_quotes_select_own on public.ride_quotes
  for select to authenticated
  using (passenger_id = (select auth.uid()));

-- fare_settings: nenhuma policy — só service role lê/escreve.

-- ---------------------------------------------------------------------------
-- Realtime: os apps acompanham mudanças de status por aqui (respeita a RLS).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.rides;
  end if;
end;
$$;
