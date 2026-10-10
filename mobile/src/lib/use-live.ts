import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { describeError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

type Loaded<T> = {
  fetcher: () => Promise<T>;
  data: T | undefined;
  error: string | null;
};

/**
 * Mantém na tela o resultado de uma consulta sobre corridas, sempre atual.
 *
 * O Realtime só serve de gatilho: a cada evento em `rides` a consulta é
 * refeita, e é o resultado dela (já filtrado pela RLS) que vai para a tela.
 * Como o Realtime demora alguns segundos para começar a entregar depois de
 * assinar — e pode cair —, a consulta também é refeita ao assinar, ao voltar
 * para o app e em intervalo fixo.
 *
 * `fetcher` precisa ser estável (useCallback); passar `null` desliga tudo.
 */
export function useLive<T>(fetcher: (() => Promise<T>) | null, pollMs = 8000) {
  const channelId = useId();
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Vários gatilhos disparam a consulta ao mesmo tempo; só a mais recente pode gravar.
  const sequence = useRef(0);

  const load = useCallback(
    async (isCurrent: () => boolean = () => true) => {
      if (!fetcher) return;
      const mine = ++sequence.current;
      const stillValid = () => isCurrent() && mine === sequence.current;
      try {
        const data = await fetcher();
        if (stillValid()) setLoaded({ fetcher, data, error: null });
      } catch (error) {
        if (!stillValid()) return;
        // Mantém o último dado bom na tela e mostra o erro por cima.
        setLoaded((previous) => ({
          fetcher,
          data: previous?.fetcher === fetcher ? previous.data : undefined,
          error: describeError(error),
        }));
      }
    },
    [fetcher],
  );

  useEffect(() => {
    if (!fetcher) return;

    let current = true;
    const run = () => {
      load(() => current);
    };

    run();

    const channel = supabase
      .channel(`live:${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, run)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') run();
      });

    const interval = setInterval(run, pollMs);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });

    return () => {
      current = false;
      clearInterval(interval);
      appState.remove();
      supabase.removeChannel(channel);
    };
  }, [fetcher, load, channelId, pollMs]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const mine = fetcher && loaded?.fetcher === fetcher ? loaded : null;

  return {
    data: mine?.data,
    error: mine?.error ?? null,
    /** Verdadeiro só até a primeira resposta (com dado ou com erro). */
    loading: Boolean(fetcher) && !mine,
    refreshing,
    refresh,
  };
}
