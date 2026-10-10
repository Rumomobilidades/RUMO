# RUMO — instruções para agentes

## Segundo cérebro (Obsidian) — protocolo obrigatório

Este projeto tem uma memória técnica permanente e um painel de orquestração em `RUMO Mob./` (vault Obsidian), compartilhados entre Claude Code, Codex e Claude Cowork. Ler `RUMO Mob./SISTEMA.md` no início de qualquer sessão — ele define o protocolo completo. Resumo:

1. **Antes de qualquer tarefa:** checar `RUMO Mob./00 Inbox/pending-sync.md` — um git hook (`scripts/git-hooks/post-commit`) enfileira ali todo commit. Processar as entradas pendentes antes de seguir.
2. Consultar `RUMO Mob./02 Projetos/Roadmap-MVP.md` (o que fazer agora e o que está bloqueado), `Pendencias-do-Usuario.md` e os índices em `RUMO Mob./01 Índices/`.
3. **Depois de qualquer tarefa não trivial:** atualizar o status no Roadmap, registrar em `23 Histórico/Historico-RUMO.md` e documentar — bug → `11 Bugs/`; decisão → ADR em `05 Decisões (ADR)/`; achado de segurança → `19 Segurança/`. Sem pedir permissão.
4. ADR com status `proposta` não é decisão tomada: confirmar com o usuário antes de implementar.

O vault está no `.gitignore` porque o repositório é **público**. Nunca escrever valores de chaves ou tokens em notas nem em arquivos versionados.

## Regras do projeto

- Preservar a landing e a integração com o Supabase; não mover a landing de lugar.
- Não fazer commit, push ou deploy sem pedido explícito — push na `main` publica em produção.
- Não aplicar migrations nem alterar dados no Supabase de produção sem autorização explícita.
- Diferenciar sempre o que existe no código do que foi verificado funcionando.
- Priorizar simplicidade, segurança e velocidade de validação do MVP.

## Stack

Next.js 15.5 (App Router), React 19, TypeScript strict, Tailwind CSS 4, shadcn/ui, Supabase, pnpm. Deploy na Vercel. App mobile ainda não existe.

Detalhes, decisões e histórico: `RUMO Mob./02 Projetos/RUMO.md`.
