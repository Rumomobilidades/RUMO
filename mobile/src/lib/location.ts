import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import type { LatLng } from '@/lib/types';

type LocationState = {
  /** `null` enquanto ainda não se sabe; depois, a posição ou a falta dela. */
  status: 'checking' | 'granted' | 'denied' | 'unavailable';
  coords: LatLng | null;
};

/**
 * Posição atual do aparelho, pedindo permissão na primeira vez. Sem permissão
 * (ou sem GPS) o app continua funcionando: a origem passa a ser digitada.
 */
export function useMyLocation(): LocationState {
  const [state, setState] = useState<LocationState>({ status: 'checking', coords: null });

  useEffect(() => {
    let current = true;

    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!current) return;
        if (permission.status !== 'granted') {
          setState({ status: 'denied', coords: null });
          return;
        }

        // A última posição conhecida chega na hora; a atual pode levar alguns segundos.
        const last = await Location.getLastKnownPositionAsync();
        if (current && last) {
          setState({
            status: 'granted',
            coords: { latitude: last.coords.latitude, longitude: last.coords.longitude },
          });
        }

        const now = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (current) {
          setState({
            status: 'granted',
            coords: { latitude: now.coords.latitude, longitude: now.coords.longitude },
          });
        }
      } catch {
        if (current) setState((previous) => (previous.coords ? previous : { status: 'unavailable', coords: null }));
      }
    })();

    return () => {
      current = false;
    };
  }, []);

  return state;
}
