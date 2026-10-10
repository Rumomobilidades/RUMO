# RUMO — app (passageiro e motorista)

App Expo único com dois papéis. Backend: Supabase (`../supabase`). Este diretório usa **npm**; a landing, na raiz, usa pnpm.

## Rodar em dois celulares

```bash
cd mobile
npm install
cp .env.example .env     # URL e chave PÚBLICA do projeto rumo-dev
npx expo start
```

1. Instale o **Expo Go** nos dois celulares, na mesma rede Wi-Fi do computador.
2. Leia o QR code do terminal em cada um (câmera no iPhone; dentro do Expo Go no Android).
3. Se a rede bloquear a conexão, use `npx expo start --tunnel`.

## Testar uma corrida completa

1. **Celular A:** Criar conta → Passageiro.
2. **Celular B:** Criar conta → Motorista. Aparece "Cadastro em análise".
3. **Aprovar o motorista:** painel do Supabase → projeto `rumo-dev` → Table Editor → `drivers` → `approval_status` = `approved`. O app do motorista atualiza sozinho em até 15 s.
4. **B:** preencher o veículo (opcional) e tocar em **Ficar online**.
5. **A:** digitar origem e destino (rua, número e cidade) → **Calcular estimativa** → conferir os endereços encontrados → **Pedir corrida**.
6. **B:** a solicitação aparece na lista → **Aceitar corrida**.
7. **A:** o status muda para "Motorista a caminho" e aparecem nome, telefone e veículo.
8. **B:** **Cheguei ao local** → **Iniciar viagem** → **Finalizar viagem**. O celular A acompanha cada mudança.
9. Os dois veem o resumo e a corrida em **Histórico de corridas**.

Também vale testar: cancelar pelo passageiro antes da viagem, e dois motoristas tocando em Aceitar ao mesmo tempo (um recebe "já foi aceita por outro motorista").

## Como funciona

- O app só lê tabelas; toda mudança passa pelas funções do banco (`supabase/migrations/0004_ride_rpcs.sql`).
- Preço, distância e duração vêm da Edge Function `estimate-ride` — o app nunca envia esses valores.
- As telas se atualizam por Supabase Realtime, com consulta periódica de reserva (`src/lib/use-live.ts`).
- Nenhuma chave secreta fica no app: só a URL e a chave pública.

## Mapas — provisório

Ainda **não há mapa na tela** nem busca de endereço com sugestões. A estimativa usa serviços públicos baseados no OpenStreetMap (Photon e OSRM): dados reais, mas sem garantia de disponibilidade e com precisão de número de casa limitada. Com uma chave do Google (Places e Routes), troca-se `geocode` e `route` em `supabase/functions/estimate-ride/index.ts`.

## Verificar antes de commitar

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
npm run test:data     # camada de dados do app contra o rumo-dev
```

Para adicionar pacotes: `npx expo install <pacote>`.
