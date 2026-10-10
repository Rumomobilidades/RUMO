-- Regras de negócio das corridas. Únicas portas de escrita em `ride_quotes`
-- e `rides`. Todas SECURITY DEFINER com search_path vazio; os erros de regra
-- saem com SQLSTATE P0001 e um código curto em MESSAGE, que o app traduz.
--
-- Códigos: not_authenticated, not_a_passenger, quote_not_found, quote_expired,
-- quote_already_used, passenger_has_active_ride, driver_not_approved,
-- driver_offline, driver_has_active_ride, ride_not_available, ride_not_found,
-- invalid_transition, ride_not_cancellable.

-- ---------------------------------------------------------------------------
-- create_ride_quote — chamada SÓ pelo servidor (Edge Function com service
-- role), depois de obter distância e duração reais do provedor de rotas.
-- ---------------------------------------------------------------------------
create function public.create_ride_quote(
  p_passenger_id uuid,
  p_origin_address text,
  p_origin_lat double precision,
  p_origin_lng double precision,
  p_destination_address text,
  p_destination_lat double precision,
  p_destination_lng double precision,
  p_distance_m integer,
  p_duration_s integer
)
returns public.ride_quotes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fare public.fare_settings;
  v_price integer;
  v_quote public.ride_quotes;
begin
  if not exists (
    select 1 from public.profiles p where p.id = p_passenger_id and p.role = 'passageiro'
  ) then
    raise exception 'not_a_passenger';
  end if;

  select * into strict v_fare from public.fare_settings;

  v_price := greatest(
    v_fare.minimum_cents,
    v_fare.base_cents
      + round(v_fare.per_km_cents * p_distance_m / 1000.0)
      + round(v_fare.per_minute_cents * p_duration_s / 60.0)
  );

  insert into public.ride_quotes (
    passenger_id, origin_address, origin_lat, origin_lng,
    destination_address, destination_lat, destination_lng,
    distance_m, duration_s, price_cents
  )
  values (
    p_passenger_id, p_origin_address, p_origin_lat, p_origin_lng,
    p_destination_address, p_destination_lat, p_destination_lng,
    p_distance_m, p_duration_s, v_price
  )
  returning * into v_quote;

  return v_quote;
end;
$$;

-- ---------------------------------------------------------------------------
-- request_ride — passageiro transforma uma cotação válida em corrida.
-- ---------------------------------------------------------------------------
create function public.request_ride(p_quote_id uuid)
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
      distance_m, duration_s, estimated_price_cents
    )
    values (
      v_quote.id, v_uid, v_quote.origin_address, v_quote.origin_lat, v_quote.origin_lng,
      v_quote.destination_address, v_quote.destination_lat, v_quote.destination_lng,
      v_quote.distance_m, v_quote.duration_s, v_quote.price_cents
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

-- ---------------------------------------------------------------------------
-- set_driver_online — só motorista aprovado fica online.
-- ---------------------------------------------------------------------------
create function public.set_driver_online(p_online boolean)
returns public.drivers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_driver public.drivers;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_driver from public.drivers d where d.id = v_uid for update;

  if not found or v_driver.approval_status <> 'approved' then
    raise exception 'driver_not_approved';
  end if;

  if not p_online and exists (
    select 1 from public.rides r
    where r.driver_id = v_uid and r.status in ('accepted', 'arrived', 'in_progress')
  ) then
    raise exception 'driver_has_active_ride';
  end if;

  update public.drivers set is_online = p_online where id = v_uid
  returning * into v_driver;

  return v_driver;
end;
$$;

-- ---------------------------------------------------------------------------
-- accept_ride — aceitação atômica. O UPDATE condicional é o que decide a
-- disputa: com dois motoristas ao mesmo tempo, o segundo espera o lock da
-- linha, reavalia `status = 'requested'` e não encontra mais nada.
-- ---------------------------------------------------------------------------
create function public.accept_ride(p_ride_id uuid)
returns public.rides
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_driver public.drivers;
  v_ride public.rides;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_driver from public.drivers d where d.id = v_uid;

  if not found or v_driver.approval_status <> 'approved' then
    raise exception 'driver_not_approved';
  end if;
  if not v_driver.is_online then
    raise exception 'driver_offline';
  end if;

  begin
    update public.rides
    set driver_id = v_uid,
        status = 'accepted',
        accepted_at = now()
    where id = p_ride_id
      and status = 'requested'
      and driver_id is null
      and passenger_id <> v_uid
    returning * into v_ride;
  exception
    when unique_violation then
      raise exception 'driver_has_active_ride';
  end;

  if not found then
    raise exception 'ride_not_available';
  end if;

  return v_ride;
end;
$$;

-- ---------------------------------------------------------------------------
-- advance_ride_status — accepted → arrived → in_progress → completed,
-- sempre pelo motorista da corrida e um passo por vez.
-- ---------------------------------------------------------------------------
create function public.advance_ride_status(p_ride_id uuid, p_to text)
returns public.rides
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_from text;
  v_ride public.rides;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  v_from := case p_to
    when 'arrived' then 'accepted'
    when 'in_progress' then 'arrived'
    when 'completed' then 'in_progress'
  end;

  if v_from is null then
    raise exception 'invalid_transition';
  end if;

  update public.rides
  set status = p_to,
      arrived_at = case when p_to = 'arrived' then now() else arrived_at end,
      started_at = case when p_to = 'in_progress' then now() else started_at end,
      completed_at = case when p_to = 'completed' then now() else completed_at end
  where id = p_ride_id
    and driver_id = v_uid
    and status = v_from
  returning * into v_ride;

  if not found then
    if exists (select 1 from public.rides r where r.id = p_ride_id and r.driver_id = v_uid) then
      raise exception 'invalid_transition';
    end if;
    raise exception 'ride_not_found';
  end if;

  return v_ride;
end;
$$;

-- ---------------------------------------------------------------------------
-- cancel_ride — passageiro ou motorista da corrida, antes de a viagem começar.
-- ---------------------------------------------------------------------------
create function public.cancel_ride(p_ride_id uuid, p_reason text default null)
returns public.rides
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_ride public.rides;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  update public.rides
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = v_uid,
      cancel_reason = nullif(trim(left(coalesce(p_reason, ''), 300)), '')
  where id = p_ride_id
    and (passenger_id = v_uid or driver_id = v_uid)
    and status in ('requested', 'accepted', 'arrived')
  returning * into v_ride;

  if not found then
    if exists (
      select 1 from public.rides r
      where r.id = p_ride_id and (r.passenger_id = v_uid or r.driver_id = v_uid)
    ) then
      raise exception 'ride_not_cancellable';
    end if;
    raise exception 'ride_not_found';
  end if;

  return v_ride;
end;
$$;

-- ---------------------------------------------------------------------------
-- Quem pode executar o quê. Função nova nasce executável por PUBLIC.
-- ---------------------------------------------------------------------------
revoke execute on function
  public.create_ride_quote(uuid, text, double precision, double precision, text, double precision, double precision, integer, integer),
  public.request_ride(uuid),
  public.set_driver_online(boolean),
  public.accept_ride(uuid),
  public.advance_ride_status(uuid, text),
  public.cancel_ride(uuid, text)
  from public, anon, authenticated;

grant execute on function
  public.create_ride_quote(uuid, text, double precision, double precision, text, double precision, double precision, integer, integer)
  to service_role;

grant execute on function
  public.request_ride(uuid),
  public.set_driver_online(boolean),
  public.accept_ride(uuid),
  public.advance_ride_status(uuid, text),
  public.cancel_ride(uuid, text)
  to authenticated;
