// Espelha supabase/migrations/0003_profiles_drivers_rides.sql. Trocar por
// tipos gerados (`supabase gen types`) quando o projeto rumo-dev existir.

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
