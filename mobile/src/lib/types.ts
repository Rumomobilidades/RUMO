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

export type Quote = {
  id: string;
  origin_address: string;
  destination_address: string;
  distance_m: number;
  duration_s: number;
  price_cents: number;
  expires_at: string;
};

export type Ride = {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  origin_address: string;
  destination_address: string;
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
