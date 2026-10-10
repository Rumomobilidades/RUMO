# Migrations

| Arquivo                           | Conteúdo                                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `0001_create_waitlist.sql`        | Tabela `waitlist` da landing (RLS sem policy pública)                                                                            |
| `0002_waitlist_metadata_lgpd.sql` | Consentimento LGPD, metadados e `set_updated_at()`                                                                               |
| `0003_profiles_drivers_rides.sql` | Base do app: `profiles`, `drivers`, `fare_settings`, `ride_quotes`, `rides`, RLS e Realtime                                      |
| `0004_ride_rpcs.sql`              | Regras de corrida: `create_ride_quote`, `request_ride`, `set_driver_online`, `accept_ride`, `advance_ride_status`, `cancel_ride` |

## Regras

- Toda tabela nasce com RLS e com os privilégios padrão de `anon`/`authenticated` revogados.
- O app só lê; toda escrita em `rides` e `ride_quotes` passa pelas funções de `0004`.
- Preço, distância e duração nunca vêm do client: saem de uma cotação criada pelo servidor.
- Aprovar motorista: alterar `drivers.approval_status` para `approved` pelo dashboard.
- Tarifa: linha única em `fare_settings` (valores iniciais provisórios).

## Testar

```bash
pnpm test:db
```

Aplica todas as migrations num Postgres embutido e roda os cenários de `supabase/tests/rides.test.mjs`. Não toca em nenhum banco real.

## Aplicar

Primeiro no projeto de desenvolvimento; produção só depois de validado.

```bash
supabase link --project-ref <ref>
supabase db push
```

## Futuro (não implementado)

`payments`, `subscriptions`, `companies`, `notifications`, `logs`.
