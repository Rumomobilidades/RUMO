# RUMO — app (passageiro e motorista)

App Expo único com dois papéis. Backend: Supabase (migrations em `../supabase/migrations`).

## Rodar

```bash
cd mobile
npm install
cp .env.example .env     # URL e chave pública do projeto Supabase de desenvolvimento
npx expo start
```

Abra o QR code no Expo Go. Sem o `.env`, o app mostra uma tela de configuração.

Este diretório usa **npm** (a landing, na raiz, usa pnpm). Para adicionar pacotes: `npx expo install <pacote>`.

## Verificar antes de commitar

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## O que existe

- Cadastro e login por e-mail e senha, com escolha de papel.
- Home do passageiro (sem pedido de corrida ainda).
- Home do motorista: situação de aprovação e botão online/offline.

Aprovar um motorista: no dashboard do Supabase, mudar `drivers.approval_status` para `approved`.
