import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar, BottomModal, Divider, Row } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import type { Profile } from '@/lib/types';

type Props = { profile: Profile; visible: boolean; onClose: () => void };

/** Menu da conta: quem está logado, histórico e sair. */
export function AccountMenu({ profile, visible, onClose }: Props) {
  const router = useRouter();
  const { session, signOut } = useAuth();

  return (
    <BottomModal visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Avatar name={profile.full_name} size={56} />
        <View style={styles.headerText}>
          <ThemedText type="heading" numberOfLines={1}>
            {profile.full_name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {profile.role === 'motorista' ? 'Motorista' : 'Passageiro'} · {session?.user.email}
          </ThemedText>
        </View>
      </View>
      <Divider />
      <Row
        icon="time-outline"
        title="Histórico de corridas"
        onPress={() => {
          onClose();
          router.push('/historico');
        }}
      />
      <Row
        icon="log-out-outline"
        title="Sair da conta"
        danger
        trailing={null}
        onPress={() => {
          onClose();
          signOut();
        }}
      />
    </BottomModal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerText: { flex: 1, gap: Spacing.half },
});
