# RUMO

Base oficial da plataforma RUMO. Hoje só o módulo de Landing Page + captação
de waitlist está ativo; a arquitetura já nasce preparada para os próximos
módulos (auth, dashboard, motorista, passageiro, empresa, admin, assinaturas)
sem precisar de reconstrução. Veja `features/_future/*/README.md` e
`supabase/migrations/README.md` para o roadmap de cada módulo.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Framer Motion · Supabase · React Hook Form · Zod · TanStack Query

## Rodando localmente

```bash
pnpm install
cp .env.example .env.local   # preencha com as credenciais do seu projeto Supabase
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Veja `.env.example`. As três obrigatórias para o formulário de waitlist
funcionar:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (nunca expor ao client — só usada em `services/supabase/admin.ts`)

As variáveis de analytics (`NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA4_ID`, etc.)
são opcionais — o script correspondente só carrega se a env var existir.

## Banco de dados (Supabase)

A migration da tabela `waitlist` está em `supabase/migrations/0001_create_waitlist.sql`.
Para aplicá-la no seu projeto:

```bash
npx supabase login
npx supabase link --project-ref <seu-project-ref>
npx supabase db push
```

Depois, regenere os tipos TypeScript do schema:

```bash
npx supabase gen types typescript --linked > types/database.types.ts
```

## Estrutura

```
app/            rotas, layouts, route handlers (App Router)
components/     design system (shadcn/ui, navbar, footer, primitivos compartilhados)
features/       lógica + UI por domínio de negócio (landing hoje; futuros em features/_future)
services/       acesso a dados externos (Supabase, analytics) — única camada que fala com o banco
lib/            clients, env parsing, constantes
hooks/          hooks reutilizáveis de UI/estado
providers/      Context providers globais (TanStack Query, Analytics)
types/          tipos compartilhados, incluindo o schema do Supabase
supabase/       migrations SQL versionadas
middleware.ts   hoje normaliza headers; ponto único para auth/session no futuro
```

## Deploy

Projeto pensado para Vercel: conecte o repositório, configure as env vars
acima em Production/Preview/Development e rode a migration no Supabase antes
do primeiro deploy.
