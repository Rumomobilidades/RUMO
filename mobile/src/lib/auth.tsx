import type { Session } from '@supabase/supabase-js';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { unregisterPush } from '@/lib/notifications';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

type AuthState = {
  /** Verdadeiro até a sessão salva ser lida do armazenamento. */
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  profileError: string | null;
  reloadProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  // Guardado junto com o dono, para nunca mostrar o perfil de uma sessão anterior.
  const [loaded, setLoaded] = useState<{
    userId: string;
    profile: Profile | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  const reloadProfile = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role')
      .eq('id', userId)
      .maybeSingle();

    setLoaded({
      userId,
      profile: (data as Profile | null) ?? null,
      error: error ? error.message : data ? null : 'Perfil não encontrado para esta conta.',
    });
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    if (!userId) return;

    supabase
      .from('profiles')
      .select('id, full_name, phone, role')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoaded({
          userId,
          profile: (data as Profile | null) ?? null,
          error: error ? error.message : data ? null : 'Perfil não encontrado para esta conta.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const current = loaded && loaded.userId === userId ? loaded : null;
  const profile = current?.profile ?? null;
  const profileError = current?.error ?? null;

  const signOut = useCallback(async () => {
    // Antes de sair: este aparelho deixa de receber os avisos desta conta.
    await unregisterPush();
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ loading, session, profile, profileError, reloadProfile, signOut }),
    [loading, session, profile, profileError, reloadProfile, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return value;
}
