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
4. **B:** preencher **Meu veículo** (opcional) e tocar em **Ficar online**.
5. **A:** permitir a localização → tocar em **Para onde?** → digitar o destino (rua, número e cidade) → **Ver preço** → conferir os endereços → **Confirmar RUMO**.
6. **B:** a solicitação aparece na lista → **Aceitar corrida**.
7. **A:** o status muda para "Motorista a caminho" e aparecem nome, telefone e veículo.
8. **B:** **Cheguei ao local** → **Iniciar viagem** → **Finalizar viagem**. O celular A acompanha cada mudança.
9. Os dois veem o resumo; o histórico fica no menu da conta (botão redondo no canto superior esquerdo).

Também vale testar: cancelar pelo passageiro antes da viagem, e dois motoristas tocando em Aceitar ao mesmo tempo (um recebe "já foi aceita por outro motorista").

## Como funciona

- O app só lê tabelas; toda mudança passa pelas funções do banco (`supabase/migrations/0004_ride_rpcs.sql`).
- Preço, distância e duração vêm da Edge Function `estimate-ride` — o app nunca envia esses valores.
- As telas se atualizam por Supabase Realtime, com consulta periódica de reserva (`src/lib/use-live.ts`).
- Nenhuma chave secreta fica no app: só a URL e a chave pública.

## Layout

Modelo "mapa inteiro + painel inferior": o mapa ocupa a tela, os controles flutuam no topo e todo o fluxo acontece no painel de baixo (`src/components/map-screen.tsx`). Peças visuais em `src/components/ui.tsx`; cores e medidas em `src/constants/theme.ts`.

- **Passageiro:** "Para onde?" → tela de busca (embarque pela localização atual ou digitado) → opção de corrida com preço → procurando motorista → acompanhamento com etapas → resumo com linha do tempo.
- **Motorista:** indicador Online/Offline → solicitações com valor em destaque → corrida ativa com o próximo passo → resumo.

## Mapas — provisório

- O **mapa na tela** usa `react-native-maps`: Apple Maps no iPhone e Google Maps no Android. No Expo Go funciona sem chave; um app próprio (build) para Android vai precisar da chave do Google.
- A **estimativa** usa serviços públicos baseados no OpenStreetMap (Photon e OSRM): dados reais, mas sem garantia de disponibilidade, sem trânsito e com precisão de número de casa limitada.
- O **traçado da rota** no mapa vem do mesmo serviço público e é só visual; se ele não responder, aparecem só os dois pontos.
- Ainda não há sugestão de endereços ao digitar nem posição do motorista ao vivo.

Com uma chave do Google (Places e Routes), troca-se `geocode`, `reverseGeocode` e `route` em `supabase/functions/estimate-ride/index.ts`.

## Verificar antes de commitar

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
npm run test:data     # camada de dados do app contra o rumo-dev
```

Para adicionar pacotes: `npx expo install <pacote>`.
