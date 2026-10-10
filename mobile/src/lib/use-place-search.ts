import { useEffect, useState } from 'react';

import { describeError } from '@/lib/errors';
import { searchPlaces } from '@/lib/rides';
import type { LatLng, PlaceSuggestion } from '@/lib/types';

export const MIN_QUERY = 3;
const DEBOUNCE_MS = 350;

type Result = { query: string; places: PlaceSuggestion[]; error: string | null };

/**
 * Sugestões de endereço para o texto digitado. Espera a pessoa parar de
 * digitar antes de consultar e descarta respostas de textos antigos.
 */
export function usePlaceSearch(text: string, near: LatLng | null) {
  const query = text.trim();
  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (query.length < MIN_QUERY) return;
    let current = true;

    const timer = setTimeout(() => {
      searchPlaces(query, near)
        .then((places) => {
          if (current) setResult({ query, places, error: null });
        })
        .catch((error) => {
          if (current) setResult({ query, places: [], error: describeError(error) });
        });
    }, DEBOUNCE_MS);

    return () => {
      current = false;
      clearTimeout(timer);
    };
    // `near` só ordena os resultados; não vale refazer a busca a cada leitura do GPS.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, attempt]);

  const active = query.length >= MIN_QUERY;
  const mine = active && result?.query === query ? result : null;

  return {
    active,
    loading: active && !mine,
    places: mine?.places ?? [],
    error: mine?.error ?? null,
    retry: () => {
      setResult(null);
      setAttempt((value) => value + 1);
    },
  };
}
