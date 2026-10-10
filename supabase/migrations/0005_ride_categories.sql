-- Categorias de viagem. O app lista o que estiver ativo aqui e mostra o preço
-- de cada uma; nada de categoria ou preço fixo no código do app.
--
-- Nasce só com a categoria base "RUMO" (multiplicador 1,00 = tarifa de
-- fare_settings). Novas categorias são linhas novas nesta tabela.

create table public.ride_categories (
  id text primary key,
  name text not null,
  description text,
  seats smallint not null default 4 check (seats between 1 and 8),
  -- Aplicado sobre a tarifa base (fare_settings) antes do valor mínimo.
  price_multiplier numeric(4, 2) not null default 1.00 check (price_multiplier > 0),
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ride_categories_set_updated_at
  before update on public.ride_categories
  for each row
  execute function public.set_updated_at();

insert into public.ride_categories (id, name, description, seats, price_multiplier, sort_order)
values ('rumo', 'RUMO', 'Viagem do dia a dia', 4, 1.00, 1);

alter table public.ride_quotes
  add column category_id text not null default 'rumo' references public.ride_categories (id);

alter table public.rides
  add column category_id text not null default 'rumo' references public.ride_categories (id);

revoke all on public.ride_categories from anon, authenticated;
grant select on public.ride_categories to authenticated;

alter table public.ride_categories enable row level security;

create policy ride_categories_select_active on public.ride_categories
  for select to authenticated
  using (is_active);

-- ---------------------------------------------------------------------------
-- create_ride_quote ganha a categoria (padrão 'rumo', então chamadas antigas
-- com 9 argumentos continuam valendo).
-- ---------------------------------------------------------------------------
drop function public.create_ride_quote(
  uuid, text, double precision, double precision, text, double precision, double precision, integer, integer
);

create function public.create_ride_quote(
  p_passenger_id uuid,
  p_origin_address text,
  p_origin_lat double precision,
  p_origin_lng double precision,
  p_destination_address text,
  p_destination_lat double precision,
  p_destination_lng double precision,
  p_distance_m integer,
  p_duration_s integer,
  p_category_id text default 'rumo'
)
returns public.ride_quotes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fare public.fare_settings;
  v_multiplier numeric;
  v_price integer;
  v_quote public.ride_quotes;
begin
  if not exists (
    select 1 from public.profiles p where p.id = p_passenger_id and p.role = 'passageiro'
  ) then
    raise exception 'not_a_passenger';
  end if;

  select c.price_multiplier into v_multiplier
  from public.ride_categories c
  where c.id = p_category_id and c.is_active;

  if not found then
    raise exception 'category_not_found';
  end if;

  select * into strict v_fare from public.fare_settings;

  v_price := greatest(
    v_fare.minimum_cents,
    round(
      (
        v_fare.base_cents
        + v_fare.per_km_cents * p_distance_m / 1000.0
        + v_fare.per_minute_cents * p_duration_s / 60.0
      ) * v_multiplier
    )
  );

  insert into public.ride_quotes (
    passenger_id, origin_address, origin_lat, origin_lng,
    destination_address, destination_lat, destination_lng,
    distance_m, duration_s, price_cents, category_id
  )
  values (
    p_passenger_id, p_origin_address, p_origin_lat, p_origin_lng,
    p_destination_address, p_destination_lat, p_destination_lng,
    p_distance_m, p_duration_s, v_price, p_category_id
  )
  returning * into v_quote;

  return v_quote;
end;
$$;

revoke execute on function public.create_ride_quote(
  uuid, text, double precision, double precision, text, double precision, double precision, integer, integer, text
) from public, anon, authenticated;

grant execute on function public.create_ride_quote(
  uuid, text, double precision, double precision, text, double precision, double precision, integer, integer, text
) to service_role;

-- ---------------------------------------------------------------------------
-- request_ride passa a levar a categoria da cotação para a corrida.
-- ---------------------------------------------------------------------------
create or replace function public.request_ride(p_quote_id uuid)
returns public.rides
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_quote public.ride_quotes;
  v_ride public.rides;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_quote
  from public.ride_quotes q
  where q.id = p_quote_id and q.passenger_id = v_uid
  for update;

  if not found then
    raise exception 'quote_not_found';
  end if;
  if v_quote.used_at is not null then
    raise exception 'quote_already_used';
  end if;
  if v_quote.expires_at <= now() then
    raise exception 'quote_expired';
  end if;

  begin
    insert into public.rides (
      quote_id, passenger_id, origin_address, origin_lat, origin_lng,
      destination_address, destination_lat, destination_lng,
      distance_m, duration_s, estimated_price_cents, category_id
    )
    values (
      v_quote.id, v_uid, v_quote.origin_address, v_quote.origin_lat, v_quote.origin_lng,
      v_quote.destination_address, v_quote.destination_lat, v_quote.destination_lng,
      v_quote.distance_m, v_quote.duration_s, v_quote.price_cents, v_quote.category_id
    )
    returning * into v_ride;
  exception
    when unique_violation then
      raise exception 'passenger_has_active_ride';
  end;

  update public.ride_quotes set used_at = now() where id = v_quote.id;

  return v_ride;
end;
$$;
