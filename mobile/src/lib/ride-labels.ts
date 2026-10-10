import type { Ride, RideStatus, Role } from '@/lib/types';

const PASSENGER: Record<RideStatus, string> = {
  requested: 'Procurando motorista',
  accepted: 'Motorista a caminho',
  arrived: 'Motorista chegou',
  in_progress: 'Em viagem',
  completed: 'Corrida concluída',
  cancelled: 'Corrida cancelada',
};

const DRIVER: Record<RideStatus, string> = {
  requested: 'Aguardando aceite',
  accepted: 'A caminho do passageiro',
  arrived: 'No local de embarque',
  in_progress: 'Em viagem',
  completed: 'Corrida concluída',
  cancelled: 'Corrida cancelada',
};

export function statusLabel(status: RideStatus, role: Role) {
  return (role === 'motorista' ? DRIVER : PASSENGER)[status];
}

export function isActive(ride: Ride) {
  return ride.status !== 'completed' && ride.status !== 'cancelled';
}

const RECENT_MS = 30 * 60 * 1000;

/** Encerrada há pouco: ainda vale mostrar o resumo em vez de voltar direto ao início. */
export function endedRecently(ride: Ride) {
  const endedAt = ride.completed_at ?? ride.cancelled_at;
  return Boolean(endedAt) && Date.now() - new Date(endedAt!).getTime() < RECENT_MS;
}

export function whoCancelled(ride: Ride, myId: string) {
  if (ride.status !== 'cancelled') return null;
  if (ride.cancelled_by === myId) return 'Você cancelou esta corrida.';
  return ride.cancelled_by === ride.passenger_id
    ? 'O passageiro cancelou esta corrida.'
    : 'O motorista cancelou esta corrida.';
}
