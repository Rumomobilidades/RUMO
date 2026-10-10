import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, ErrorText } from '@/components/form';
import { Loading } from '@/components/ride';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { firstName } from '@/lib/format';
import type { Profile } from '@/lib/types';
import { DriverHome, useDriverHome } from '@/screens/driver-home';
import { PassengerHome, usePassengerHome } from '@/screens/passenger-home';

function Header({ profile }: { profile: Profile }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="subtitle">Olá, {firstName(profile.full_name)}</ThemedText>
        <ThemedText themeColor="textSecondary">
          {profile.role === 'motorista' ? 'Motorista' : 'Passageiro'}
        </ThemedText>
      </View>
    </View>
  );
}

function Footer() {
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.footer}>
      <Button
        label="Histórico de corridas"
        variant="secondary"
        onPress={() => router.push('/historico')}
      />
      <Button label="Sair" variant="secondary" onPress={signOut} />
    </View>
  );
}

function PassengerScreen({ profile }: { profile: Profile }) {
  const live = usePassengerHome(profile.id);

  return (
    <Screen onRefresh={live.refresh} refreshing={live.refreshing}>
      <Header profile={profile} />
      <PassengerHome userId={profile.id} live={live} />
      <Footer />
    </Screen>
  );
}

function DriverScreen({ profile }: { profile: Profile }) {
  const live = useDriverHome(profile.id);

  return (
    <Screen onRefresh={live.refresh} refreshing={live.refreshing}>
      <Header profile={profile} />
      <DriverHome userId={profile.id} live={live} />
      <Footer />
    </Screen>
  );
}

export default function HomeScreen() {
  const { profile, profileError, reloadProfile, signOut } = useAuth();

  if (profileError) {
    return (
      <Screen>
        <ErrorText>{profileError}</ErrorText>
        <Button label="Tentar de novo" variant="secondary" onPress={reloadProfile} />
        <Button label="Sair" variant="secondary" onPress={signOut} />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <Loading label="Carregando seu perfil" />
      </Screen>
    );
  }

  return profile.role === 'motorista' ? (
    <DriverScreen profile={profile} />
  ) : (
    <PassengerScreen profile={profile} />
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', marginTop: Spacing.three },
  headerText: { flex: 1, gap: Spacing.one },
  footer: { marginTop: 'auto', gap: Spacing.two },
});
