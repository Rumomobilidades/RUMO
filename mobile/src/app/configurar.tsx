import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

export default function ConfigurarScreen() {
  return (
    <Screen>
      <ThemedText type="subtitle">Falta configurar o Supabase</ThemedText>
      <ThemedText themeColor="textSecondary">
        Copie <ThemedText type="code">mobile/.env.example</ThemedText> para{' '}
        <ThemedText type="code">mobile/.env</ThemedText>, preencha a URL e a chave pública do
        projeto de desenvolvimento e reinicie o servidor com{' '}
        <ThemedText type="code">npx expo start -c</ThemedText>.
      </ThemedText>
    </Screen>
  );
}
