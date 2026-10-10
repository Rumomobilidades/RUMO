import { useEffect, useState } from 'react';

import { fetchRouteLine } from '@/lib/rides';
import type { LatLng } from '@/lib/types';

/** Traçado da rota entre dois pontos, só para desenhar no mapa. */
export function useRouteLine(origin: LatLng | null, destination: LatLng | null) {
  const key =
    origin && destination
      ? `${origin.latitude},${origin.longitude};${destination.latitude},${destination.longitude}`
      : null;
  const [loaded, setLoaded] = useState<{ key: string; line: LatLng[] } | null>(null);

  useEffect(() => {
    if (!key || !origin || !destination) return;
    let current = true;

    fetchRouteLine(origin, destination).then((line) => {
      if (current) setLoaded({ key, line });
    });

    return () => {
      current = false;
    };
    // `key` resume os dois pontos; os objetos mudam de identidade a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return loaded && loaded.key === key ? loaded.line : [];
}

export function ridePoints(trip: {
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
} | null) {
  if (!trip) return { origin: null, destination: null };
  return {
    origin: { latitude: trip.origin_lat, longitude: trip.origin_lng },
    destination: { latitude: trip.destination_lat, longitude: trip.destination_lng },
  };
}
