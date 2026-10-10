import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { Button, ErrorText, Field, Segmented } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { describeError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { Role } from '@/lib/types';

const ROLES = [
  { value: 'passageiro', label: 'Passageiro', icon: 'person' },
  { value: 'motorista', label: 'Motorista', icon: 'car-sport' },
] as const;

export default function CadastroScreen() {
  const [role, setRole] = useState<Role>('passageiro');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (name.trim().length < 2) return setError('Digite seu nome completo.');
    if (phone.replace(/\D/g, '').length < 10) return setError('Digite um WhatsApp válido com DDD.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Digite um e-mail válido.');
    if (password.length < 8) return setError('A senha precisa ter pelo menos 8 caracteres.');

    setBusy(true);
    // O perfil (e o registro de motorista) é criado no banco pelo trigger
    // handle_new_user a partir destes metadados.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: name.trim(), phone: phone.trim(), role } },
    });
    setBusy(false);

    if (signUpError) return setError(describeError(signUpError));

    // Sem sessão = o projeto exige confirmação por e-mail antes do login.
    if (!data.session) setNeedsConfirmation(true);
  }

  if (needsConfirmation) {
    return (
      <Screen>
        <View style={styles.header}>
          <ThemedText type="subtitle">Confirme seu e-mail</ThemedText>
          <ThemedText themeColor="textSecondary">
            Enviamos um link para {email.trim().toLowerCase()}. Depois de confirmar, volte e entre
            com sua senha.
          </ThemedText>
        </View>
        <Link href="/" style={styles.link}>
          <ThemedText type="linkPrimary">Ir para o login</ThemedText>
        </Link>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <BrandMark />
        <ThemedText type="subtitle">Criar conta</ThemedText>
        <ThemedText themeColor="textSecondary">
          {role === 'motorista'
            ? 'Cadastros de motorista passam por aprovação antes de receber corridas.'
            : 'Leva menos de um minuto.'}
        </ThemedText>
      </View>

      <View style={styles.form}>
        <Segmented options={ROLES} value={role} onChange={setRole} />
        <Field
          label="Nome completo"
          value={name}
          onChangeText={setName}
          placeholder="Seu nome"
          autoComplete="name"
          textContentType="name"
        />
        <Field
          label="WhatsApp"
          value={phone}
          onChangeText={setPhone}
          placeholder="(47) 99999-9999"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
        />
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
          placeholder="Mínimo de 8 caracteres"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <ErrorText>{error}</ErrorText>
        <Button label="Criar conta" onPress={handleSubmit} busy={busy} />
      </View>

      <Link href="/" style={styles.link}>
        <ThemedText type="linkPrimary">Já tenho conta</ThemedText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two, marginTop: Spacing.three },
  form: { gap: Spacing.three },
  link: { alignSelf: 'center' },
});
