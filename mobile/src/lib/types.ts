// Espelha supabase/migrations/0003_profiles_drivers_rides.sql. Trocar por
// tipos gerados (`supabase gen types`) quando fizer sentido.

export type Role = 'passageiro' | 'motorista';

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: Role;
};

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type Driver = {
  id: string;
  approval_status: ApprovalStatus;
  is_online: boolean;
  vehicle_model: string | null;
  vehicle_plate: string | null;
};

export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export const ACTIVE_STATUSES: readonly RideStatus[] = [
  'requested',
  'accepted',
  'arrived',
  'in_progress',
];

export type LatLng = { latitude: number; longitude: number };

/** Um lugar escolhido: coordenadas + o texto mostrado para a pessoa. */
export type PlaceRef = { label: string; lat: number; lng: number };

export type PlaceSuggestion = { id: string; title: string; subtitle: string; lat: number; lng: number };

export type RideCategory = { id: string; name: string; description: string | null; seats: number };

export type Quote = {
  id: string;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  distance_m: number;
  duration_s: number;
  price_cents: number;
  expires_at: string;
  category_id: string;
};

/** Uma cotação já acompanhada dos dados da sua categoria. */
export type QuoteOption = Quote & { category: RideCategory };

export type Ride = {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  category_id: string;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  distance_m: number;
  duration_s: number;
  estimated_price_cents: number;
  status: RideStatus;
  requested_at: string;
  accepted_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
};

/** A outra parte da corrida: o motorista para o passageiro, e vice-versa. */
export type Counterpart = {
  full_name: string;
  phone: string | null;
  vehicle_model?: string | null;
  vehicle_plate?: string | null;
};

export type RideView = { ride: Ride; counterpart: Counterpart | null };
