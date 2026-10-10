import { Button, ErrorText } from '@/components/form';
import { Loading } from '@/components/ride';
import { Screen } from '@/components/screen';
import { useAuth } from '@/lib/auth';
import { DriverHome } from '@/screens/driver-home';
import { PassengerHome } from '@/screens/passenger-home';

export default function HomeScreen() {
  const { profile, profileError, reloadProfile, signOut } = useAuth();

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
