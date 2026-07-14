# Roadmap de schema (documentação, não implementado)

Ordem esperada das próximas migrations, conforme os módulos forem entrando:

1. **`users`** — perfil unificado, `id` referenciando `auth.users.id` (Supabase Auth).
2. **`drivers` / `passengers` / `companies`** — extensões 1:1 de `users`, uma por perfil.
3. **`rides`** — corridas, FKs para `drivers` e `passengers`.
4. **`payments`** — transações, FK para `rides`.
5. **`subscriptions`** — planos e assinaturas (empresas e/ou motoristas), FK para `users`/`companies`.
6. **`notifications`** — fila de notificações internas, FK para `users`.
7. **`logs`** — auditoria/observabilidade, sem FK obrigatória (append-only).

Cada tabela nasce com RLS habilitado e policies explícitas por perfil —
seguindo o mesmo padrão de `0001_create_waitlist.sql` (nenhuma policy pública
por padrão, acesso mediado por Route Handlers/service role até existir
autenticação de usuário real).
