# Dashboard (futuro)

Painel pós-login para motoristas, passageiros e empresas acompanharem corridas,
ganhos e faturas. Entra como `app/(dashboard)/` com layout próprio (sidebar +
proteção de sessão via `middleware.ts`), consumindo `services/rides` e
`services/payments` (a criar). Reaproveita `components/ui` e
`components/shared` — nenhum componente da landing precisa mudar.
