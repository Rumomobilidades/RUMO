# Admin / Backoffice (futuro)

Painel interno para operação: moderação de motoristas, monitoramento de
corridas, métricas agregadas e logs. Entra como `app/(admin)/`, protegido por
role no `middleware.ts` (via tabela `users.role`). Consome `services/logs`,
`services/rides` e `services/subscriptions`.
