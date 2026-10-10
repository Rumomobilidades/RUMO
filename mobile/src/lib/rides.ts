import { supabase } from '@/lib/supabase';
import type {
  Counterpart,
  Driver,
  LatLng,
  PlaceRef,
  PlaceSuggestion,
  QuoteOption,
  Ride,
  RideStatus,
  RideView,
  Role,
} from '@/lib/types';

const RIDE_COLUMNS =
  'id, passenger_id, driver_id, category_id, origin_address, origin_lat, origin_lng, destination_address, destination_lat, destination_lng, distance_m, duration_s, estimated_price_cents, status, requested_at, accepted_at, arrived_at, started_at, completed_at, cancelled_at, cancelled_by, cancel_reason';

const DRIVER_COLUMNS = 'id, approval_status, is_online, vehicle_model, vehicle_plate';

/** Erros de regra chegam como { message: 'codigo' }; describeError traduz. */
function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw result.error;
  return result.data as T;
}

async function fetchCounterpart(ride: Ride, role: Role): Promise<Counterpart | null> {
  const otherId = role === 'passageiro' ? ride.driver_id : ride.passenger_id;
  // Antes do aceite a RLS não deixa o motorista ver o passageiro, e não há motorista.
  if (!otherId || !ride.driver_id) return null;

  const profile = unwrap(
    await supabase.from('profiles').select('full_name, phone').eq('id', otherId).maybeSingle(),
  ) as Pick<Counterpart, 'full_name' | 'phone'> | null;
  if (!profile) return null;

  if (role === 'motorista') return profile;

  const vehicle = unwrap(
    await supabase
      .from('drivers')
      .select('vehicle_model, vehicle_plate')
      .eq('id', otherId)
      .maybeSingle(),
  ) as Pick<Counterpart, 'vehicle_model' | 'vehicle_plate'> | null;

  return { ...profile, ...vehicle };
}

/** A corrida mais recente do usuário no papel dele — ativa ou já encerrada. */
export async function fetchLatestRide(userId: string, role: Role): Promise<RideView | null> {
  const ride = unwrap(
    await supabase
      .from('rides')
      .select(RIDE_COLUMNS)
      .eq(role === 'motorista' ? 'driver_id' : 'passenger_id', userId)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ) as Ride | null;

  if (!ride) return null;
  return { ride, counterpart: await fetchCounterpart(ride, role) };
}

/** Solicitações aguardando aceite. A RLS só devolve linhas a motorista aprovado e online. */
export async function fetchOpenRequests(): Promise<Ride[]> {
  return unwrap(
    await supabase
      .from('rides')
      .select(RIDE_COLUMNS)
      .eq('status', 'requested')
      .order('requested_at', { ascending: true })
      .limit(20),
  ) as Ride[];
}

export async function fetchHistory(userId: string, role: Role): Promise<Ride[]> {
  return unwrap(
    await supabase
      .from('rides')
      .select(RIDE_COLUMNS)
      .eq(role === 'motorista' ? 'driver_id' : 'passenger_id', userId)
      .in('status', ['completed', 'cancelled'])
      .order('requested_at', { ascending: false })
      .limit(50),
  ) as Ride[];
}

export async function fetchDriver(userId: string): Promise<Driver | null> {
  return unwrap(
    await supabase.from('drivers').select(DRIVER_COLUMNS).eq('id', userId).maybeSingle(),
  ) as Driver | null;
}

/** Em erro HTTP de Edge Function, o corpo com o código vem em error.context (um Response). */
async function invoke<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body: body as Record<string, unknown> });

  if (error) {
    const context = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
    const payload = await context?.json?.().catch(() => null);
    throw { message: payload?.error ?? error.message };
  }

  return data as T;
}

/** Ponto de origem ou destino: lugar escolhido, posição do aparelho ou endereço digitado. */
export type PlaceInput = PlaceRef | { lat: number; lng: number } | string;

/**
 * Pede ao servidor as cotações (rota real + tarifa), uma por categoria ativa.
 * O app não calcula preço nem define categorias.
 */
export async function estimateRide(origin: PlaceInput, destination: PlaceInput): Promise<QuoteOption[]> {
  const data = await invoke<{ quotes: QuoteOption[] }>('estimate-ride', { origin, destination });
  return data.quotes;
}

/** Sugestões de endereço para o texto digitado, priorizando o entorno de `near`. */
export async function searchPlaces(query: string, near: LatLng | null): Promise<PlaceSuggestion[]> {
  const data = await invoke<{ places: PlaceSuggestion[] }>('search-places', {
    query,
    near: near ? { lat: near.latitude, lng: near.longitude } : undefined,
  });
  return data.places;
}

export async function requestRide(quoteId: string): Promise<Ride> {
  return unwrap(await supabase.rpc('request_ride', { p_quote_id: quoteId })) as Ride;
}

export async function acceptRide(rideId: string): Promise<Ride> {
  return unwrap(await supabase.rpc('accept_ride', { p_ride_id: rideId })) as Ride;
}

/** O motorista dispensa a solicitação: ela some só para ele. */
export async function declineRide(rideId: string): Promise<void> {
  unwrap(await supabase.rpc('decline_ride', { p_ride_id: rideId }));
}

export async function advanceRide(
  rideId: string,
  to: Extract<RideStatus, 'arrived' | 'in_progress' | 'completed'>,
): Promise<Ride> {
  return unwrap(
    await supabase.rpc('advance_ride_status', { p_ride_id: rideId, p_to: to }),
  ) as Ride;
}

export async function cancelRide(rideId: string, reason?: string): Promise<Ride> {
  return unwrap(
    await supabase.rpc('cancel_ride', { p_ride_id: rideId, p_reason: reason ?? null }),
  ) as Ride;
}

export async function setDriverOnline(online: boolean): Promise<Driver> {
  return unwrap(await supabase.rpc('set_driver_online', { p_online: online })) as Driver;
}

export async function updateVehicle(userId: string, model: string, plate: string): Promise<Driver> {
  return unwrap(
    await supabase
      .from('drivers')
      .update({ vehicle_model: model.trim() || null, vehicle_plate: plate.trim().toUpperCase() || null })
      .eq('id', userId)
      .select(DRIVER_COLUMNS)
      .single(),
  ) as Driver;
}

/**
 * Traçado da rota para DESENHAR no mapa. É só visual: distância, duração e
 * preço continuam vindo da cotação do servidor. Se o serviço público de rotas
 * não responder, o mapa fica só com os dois pontos.
 */
export async function fetchRouteLine(from: LatLng, to: LatLng): Promise<LatLng[]> {
  try {
    const coords = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
    );
    if (!response.ok) return [];
    const data = (await response.json()) as {
      routes?: { geometry: { coordinates: [number, number][] } }[];
    };
    const line = data.routes?.[0]?.geometry.coordinates ?? [];
    return line.map(([longitude, latitude]) => ({ latitude, longitude }));
  } catch {
    return [];
  }
}

/** Destinos das últimas corridas concluídas, sem repetição — atalhos da tela inicial. */
export async function fetchRecentDestinations(userId: string): Promise<PlaceRef[]> {
  const rows = unwrap(
    await supabase
      .from('rides')
      .select('destination_address, destination_lat, destination_lng')
      .eq('passenger_id', userId)
      .eq('status', 'completed')
      .order('requested_at', { ascending: false })
      .limit(15),
  ) as { destination_address: string; destination_lat: number; destination_lng: number }[];

  const seen = new Set<string>();
  const places: PlaceRef[] = [];
  for (const row of rows) {
    if (seen.has(row.destination_address)) continue;
    seen.add(row.destination_address);
    places.push({ label: row.destination_address, lat: row.destination_lat, lng: row.destination_lng });
    if (places.length === 3) break;
  }
  return places;
}
