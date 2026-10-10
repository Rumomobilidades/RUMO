import { Button, ErrorText } from '@/components/form';
import { Loading } from '@/components/ride';
import { Screen } from '@/components/screen';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth';
import { setupNotifications } from '@/lib/notifications';
import { DriverHome } from '@/screens/driver-home';
import { PassengerHome } from '@/screens/passenger-home';

export default function HomeScreen() {
  const { profile, profileError, reloadProfile, signOut } = useAuth();
  const userId = profile?.id;

  useEffect(() => {
    // Pede permissão de avisos e registra o aparelho para push, uma vez por conta.
    if (userId) setupNotifications();
  }, [userId]);

  if (profileError) {
    return (
      <Screen>
        <ErrorText>{profileError}</ErrorText>
        <Button label="Tentar de novo" onPress={reloadProfile} />
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
    <DriverHome profile={profile} />
  ) : (
    <PassengerHome profile={profile} />
  );
}
