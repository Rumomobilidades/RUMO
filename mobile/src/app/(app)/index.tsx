import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, ErrorText } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { describeError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { Driver } from '@/lib/types';

const APPROVAL_LABEL: Record<Driver['approval_status'], string> = {
  pending: 'Cadastro em análise. Você será liberado depois da aprovação.',
  approved: 'Cadastro aprovado.',
  rejected: 'Cadastro não aprovado. Fale com o suporte.',
};

function DriverPanel({ userId }: { userId: string }) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from('drivers')
      .select('id, approval_status, is_online, vehicle_model, vehicle_plate')
      .eq('id', userId)
      .maybeSingle();

    return { driver: data as Driver | null, error: loadError ? describeError(loadError) : null };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    load().then((result) => {
      if (cancelled) return;
      setDriver(result.driver);
      setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function refresh() {
    setBusy(true);
    const result = await load();
    setBusy(false);
    setDriver(result.driver);
    setError(result.error);
  }

  async function toggleOnline() {
    if (!driver) return;
    setError(null);
    setBusy(true);
    const { data, error: rpcError } = await supabase.rpc('set_driver_online', {
      p_online: !driver.is_online,
    });
    setBusy(false);

    if (rpcError) setError(describeError(rpcError));
    else setDriver(data as Driver);
  }

  if (!driver) {
    return error ? <ErrorText>{error}</ErrorText> : <ActivityIndicator />;
  }

  const approved = driver.approval_status === 'approved';

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Motorista</ThemedText>
      <ThemedText themeColor="textSecondary">{APPROVAL_LABEL[driver.approval_status]}</ThemedText>
      {approved ? (
        <>
          <ThemedText>{driver.is_online ? 'Você está online.' : 'Você está offline.'}</ThemedText>
          <Button
            label={driver.is_online ? 'Ficar offline' : 'Ficar online'}
            variant={driver.is_online ? 'secondary' : 'primary'}
            onPress={toggleOnline}
            busy={busy}
          />
        </>
      ) : (
        <Button label="Atualizar situação" variant="secondary" onPress={refresh} busy={busy} />
      )}
      <ErrorText>{error}</ErrorText>
    </ThemedView>
  );
}

export default function HomeScreen() {
  const { session, profile, profileError, reloadProfile, signOut } = useAuth();

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">
          {profile ? `Olá, ${profile.full_name.split(' ')[0]}` : 'RUMO'}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{session?.user.email}</ThemedText>
      </View>

      {profileError ? (
        <View style={styles.block}>
          <ErrorText>{profileError}</ErrorText>
          <Button label="Tentar de novo" variant="secondary" onPress={reloadProfile} />
        </View>
      ) : !profile ? (
        <ActivityIndicator />
      ) : profile.role === 'motorista' ? (
        <DriverPanel userId={profile.id} />
      ) : (
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Passageiro</ThemedText>
          <ThemedText themeColor="textSecondary">
            Conta criada. O pedido de corrida entra na próxima etapa do app.
          </ThemedText>
        </ThemedView>
      )}

      <View style={styles.footer}>
        <Button label="Sair" variant="secondary" onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.one, marginTop: Spacing.three },
  block: { gap: Spacing.three },
  card: { borderRadius: 16, padding: Spacing.four, gap: Spacing.three },
  footer: { marginTop: 'auto' },
});
