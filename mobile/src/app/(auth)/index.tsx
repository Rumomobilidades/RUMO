import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ErrorText, Field } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { describeError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.');
      return;
    }

    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);

    // Em caso de sucesso o layout raiz troca para a área logada sozinho.
    if (signInError) setError(describeError(signInError));
  }

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="title">RUMO</ThemedText>
        <ThemedText themeColor="textSecondary">Entre para pedir ou aceitar corridas.</ThemedText>
      </View>

      <View style={styles.form}>
        <Field
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="voce@email.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Field
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Sua senha"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={handleSubmit}
        />
        <ErrorText>{error}</ErrorText>
        <Button label="Entrar" onPress={handleSubmit} busy={busy} />
      </View>

      <Link href="/cadastro" style={styles.link}>
        <ThemedText type="linkPrimary">Ainda não tenho conta</ThemedText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two, marginTop: Spacing.five },
  form: { gap: Spacing.three },
  link: { alignSelf: 'center' },
});
