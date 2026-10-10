-- Recusa de solicitação pelo motorista e estrutura de notificações push.

-- ---------------------------------------------------------------------------
-- ride_declines — o motorista que recusa deixa de ver aquela solicitação.
-- ---------------------------------------------------------------------------
create table public.ride_declines (
  ride_id uuid not null references public.rides (id) on delete cascade,
  driver_id uuid not null references public.drivers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ride_id, driver_id)
);

revoke all on public.ride_declines from anon, authenticated;
alter table public.ride_declines enable row level security;
-- Sem policy: só as funções abaixo (SECURITY DEFINER) leem e escrevem.

create function public.has_declined(p_ride_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.ride_declines d
    where d.ride_id = p_ride_id and d.driver_id = (select auth.uid())
  );
$$;

revoke execute on function public.has_declined(uuid) from public, anon;
grant execute on function public.has_declined(uuid) to authenticated;

drop policy rides_select on public.rides;

create policy rides_select on public.rides
  for select to authenticated
  using (
    passenger_id = (select auth.uid())
    or driver_id = (select auth.uid())
    or (
      status = 'requested'
      and (select public.is_available_driver())
      and not public.has_declined(id)
    )
  );

create function public.decline_ride(p_ride_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1 from public.drivers d where d.id = v_uid and d.approval_status = 'approved'
  ) then
    raise exception 'driver_not_approved';
  end if;

  if not exists (select 1 from public.rides r where r.id = p_ride_id and r.status = 'requested') then
    raise exception 'ride_not_available';
  end if;

  insert into public.ride_declines (ride_id, driver_id)
  values (p_ride_id, v_uid)
  on conflict do nothing;
end;
$$;

revoke execute on function public.decline_ride(uuid) from public, anon, authenticated;
grant execute on function public.decline_ride(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- push_tokens — endereço de push de cada aparelho. Um token pertence a um
-- usuário por vez: ao entrar com outra conta no mesmo aparelho, ele muda de dono.
-- ---------------------------------------------------------------------------
create table public.push_tokens (
  token text primary key check (token ~ '^Expo(nent)?PushToken\[.+\]$'),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_tokens_user_idx on public.push_tokens (user_id);

create trigger push_tokens_set_updated_at
  before update on public.push_tokens
  for each row
  execute function public.set_updated_at();

revoke all on public.push_tokens from anon, authenticated;
alter table public.push_tokens enable row level security;

create function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.push_tokens (token, user_id, platform)
  values (p_token, v_uid, p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform;
end;
$$;

-- Ao sair da conta: só o dono atual consegue remover o token.
create function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_tokens where token = p_token and user_id = (select auth.uid());
$$;

revoke execute on function public.register_push_token(text, text), public.unregister_push_token(text)
  from public, anon, authenticated;
grant execute on function public.register_push_token(text, text), public.unregister_push_token(text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- notification_log — o que a função notify-ride tentou enviar em cada evento.
-- Serve para conferir e depurar; só service role acessa.
-- ---------------------------------------------------------------------------
create table public.notification_log (
  id bigint generated always as identity primary key,
  ride_id uuid references public.rides (id) on delete cascade,
  event text not null,
  recipients integer not null default 0,
  tokens integer not null default 0,
  delivered integer not null default 0,
  errors jsonb,
  created_at timestamptz not null default now()
);

revoke all on public.notification_log from anon, authenticated;
alter table public.notification_log enable row level security;

-- ---------------------------------------------------------------------------
-- Disparo: toda criação de corrida e toda mudança de status chama a Edge
-- Function notify-ride pelo banco (pg_net), sem depender de app aberto.
--
-- O endereço da função e o segredo ficam em private.settings, preenchidos por
-- ambiente (fora do git):
--   insert into private.settings values ('notify_url', 'https://<ref>.supabase.co/functions/v1/notify-ride'),
--                                       ('notify_secret', '<mesmo valor do segredo NOTIFY_SECRET da função>');
-- Sem essas duas linhas o gatilho não faz nada.
-- ---------------------------------------------------------------------------
do $$
begin
  create extension if not exists pg_net;
exception
  when others then
    raise notice 'pg_net indisponível neste banco: notificações push ficam desligadas (%).', sqlerrm;
end;
$$;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.settings (
  key text primary key,
  value text not null
);

create function public.notify_ride_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
  v_event text;
begin
  if tg_op = 'INSERT' then
    v_event := 'requested';
  elsif new.status is distinct from old.status then
    v_event := new.status;
  else
    return new;
  end if;

  select value into v_url from private.settings where key = 'notify_url';
  select value into v_secret from private.settings where key = 'notify_secret';

  if v_url is null or v_secret is null then
    return new;
  end if;

  -- Falha ao avisar nunca pode desfazer a mudança da corrida.
  begin
    perform net.http_post(
      url := v_url,
      body := jsonb_build_object('ride_id', new.id, 'event', v_event),
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-rumo-secret', v_secret),
      timeout_milliseconds := 8000
    );
  exception
    when others then
      raise warning 'notify_ride_event: %', sqlerrm;
  end;

  return new;
end;
$$;

revoke execute on function public.notify_ride_event() from public, anon, authenticated;

create trigger rides_notify
  after insert or update of status on public.rides
  for each row
  execute function public.notify_ride_event();
