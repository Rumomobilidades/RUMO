// Aplica todas as migrations num Postgres embutido (PGlite) e testa RLS,
// privilégios e as regras de corrida. Simula o ambiente do Supabase: roles
// anon/authenticated/service_role, auth.users, auth.uid() e os default
// privileges permissivos do schema public. Não toca em nenhum banco real.
//
// Rodar: pnpm test:db
//
// Limite: o PGlite tem uma conexão só, então a disputa de dois motoristas é
// testada em sequência, não em paralelo de verdade.
import { PGlite } from "@electric-sql/pglite"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const dir = fileURLToPath(new URL("../migrations", import.meta.url))
const db = new PGlite()
let pass = 0,
  fail = 0
const ok = (name, cond, extra = "") => {
  if (cond) pass++
  else fail++
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  -> " + extra : ""}`)
}

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`)

for (const f of readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  try {
    await db.exec(readFileSync(join(dir, f), "utf8"))
    ok(`migration ${f} aplica`, true)
  } catch (e) {
    ok(`migration ${f} aplica`, false, e.message)
    process.exit(1)
  }
}

// executa SQL como um papel/usuário, numa transação (set local)
async function as(role, uid, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? ""])
    await tx.exec(`set local role ${role}`)
    return tx.query(sql, params)
  })
}
const err = async (p) => {
  try {
    await p
    return null
  } catch (e) {
    return e.message
  }
}
const expectErr = async (name, p, code) => {
  const m = await err(p)
  ok(name, m === code, m ?? "sem erro")
}

const mk = async (email, meta) =>
  (
    await db.query(
      `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
      [email, meta]
    )
  ).rows[0].id
const P1 = await mk("ana@x.co", {
  full_name: "Ana",
  role: "passageiro",
  phone: "47999990001",
})
const P2 = await mk("bia@x.co", { full_name: "Bia", role: "passageiro" })
const D1 = await mk("caio@x.co", { full_name: "Caio", role: "motorista" })
const D2 = await mk("davi@x.co", { full_name: "Davi", role: "motorista" })
const D3 = await mk("eva@x.co", { full_name: "Eva", role: "motorista" })
const X = await mk("hack@x.co", { full_name: "Hack", role: "admin" })

// --- cadastro
let r = await db.query(
  `select role from public.profiles where id = any($1) order by full_name`,
  [[P1, D1, X]]
)
ok(
  "trigger cria profile com papel",
  r.rows.map((x) => x.role).join() === "passageiro,motorista,passageiro",
  r.rows.map((x) => x.role).join()
)
r = await db.query(
  `select count(*)::int n, bool_and(approval_status='pending') p, bool_or(is_online) o from public.drivers`
)
ok("motorista nasce pendente e offline", r.rows[0].n === 3 && r.rows[0].p && !r.rows[0].o)

// --- privilégios diretos
await expectErr(
  "anon não lê rides",
  as("anon", null, `select * from public.rides`),
  "permission denied for table rides"
)
await expectErr(
  "anon não lê profiles",
  as("anon", null, `select * from public.profiles`),
  "permission denied for table profiles"
)
await expectErr(
  "anon não executa request_ride",
  as("anon", null, `select public.request_ride(gen_random_uuid())`),
  "permission denied for function request_ride"
)
await expectErr(
  "authenticated não insere em rides",
  as(
    "authenticated",
    P1,
    `insert into public.rides (quote_id, passenger_id, origin_address, origin_lat, origin_lng, destination_address, destination_lat, destination_lng, distance_m, duration_s, estimated_price_cents) values (gen_random_uuid(), $1, 'a',0,0,'b',0,0,1,1,1)`,
    [P1]
  ),
  "permission denied for table rides"
)
await expectErr(
  "authenticated não atualiza rides",
  as("authenticated", P1, `update public.rides set status='completed'`),
  "permission denied for table rides"
)
await expectErr(
  "authenticated não cria cotação",
  as("authenticated", P1, `select public.create_ride_quote($1,'a',0,0,'b',0,0,1000,60)`, [
    P1,
  ]),
  "permission denied for function create_ride_quote"
)
await expectErr(
  "authenticated não lê fare_settings",
  as("authenticated", P1, `select * from public.fare_settings`),
  "permission denied for table fare_settings"
)
await expectErr(
  "motorista não se autoaprova",
  as(
    "authenticated",
    D1,
    `update public.drivers set approval_status='approved' where id=$1`,
    [D1]
  ),
  "permission denied for table drivers"
)
await expectErr(
  "usuário não troca o próprio papel",
  as("authenticated", P1, `update public.profiles set role='motorista' where id=$1`, [
    P1,
  ]),
  "permission denied for table profiles"
)
r = await as(
  "authenticated",
  P1,
  `update public.profiles set full_name='Ana Lima' where id=$1 returning full_name`,
  [P1]
)
ok("usuário edita o próprio nome", r.rows[0]?.full_name === "Ana Lima")
r = await as(
  "authenticated",
  P1,
  `update public.profiles set full_name='x' where id=$1 returning id`,
  [P2]
)
ok("usuário não edita nome de outro", r.rows.length === 0)
r = await as("authenticated", P1, `select count(*)::int n from public.profiles`)
ok("passageiro só vê o próprio profile", r.rows[0].n === 1, String(r.rows[0].n))

// --- motorista online
await expectErr(
  "pendente não fica online",
  as("authenticated", D1, `select public.set_driver_online(true)`),
  "driver_not_approved"
)
await expectErr(
  "passageiro não fica online",
  as("authenticated", P1, `select public.set_driver_online(true)`),
  "driver_not_approved"
)
await db.query(
  `update public.drivers set approval_status='approved' where id = any($1)`,
  [[D1, D2]]
)
await as("authenticated", D1, `select public.set_driver_online(true)`)
await as("authenticated", D2, `select public.set_driver_online(true)`)

// --- cotação (servidor) e preço
const quote = async (pid, dist = 8200, dur = 900) =>
  (
    await as(
      "service_role",
      null,
      `select * from public.create_ride_quote($1,'Rua A, 10',-26.9,-48.6,'Rua B, 20',-26.95,-48.65,$2,$3)`,
      [pid, dist, dur]
    )
  ).rows[0]
let q1 = await quote(P1)
ok(
  "preço = base + km + min (400 + 1476 + 450)",
  q1.price_cents === 2326,
  String(q1.price_cents)
)
ok("tarifa mínima aplicada", (await quote(P2, 300, 60)).price_cents === 800)
await expectErr("cotação só para passageiro", quote(D1), "not_a_passenger")

// --- request_ride
await expectErr(
  "não pede corrida com cotação de outro",
  as("authenticated", P2, `select public.request_ride($1)`, [q1.id]),
  "quote_not_found"
)
let ride = (
  await as("authenticated", P1, `select * from public.request_ride($1)`, [q1.id])
).rows[0]
ok(
  "corrida criada como requested com preço da cotação",
  ride.status === "requested" &&
    ride.estimated_price_cents === 2326 &&
    ride.driver_id === null
)
await expectErr(
  "cotação não é reutilizada",
  as("authenticated", P1, `select public.request_ride($1)`, [q1.id]),
  "quote_already_used"
)
await expectErr(
  "passageiro com corrida ativa não pede outra",
  as("authenticated", P1, `select public.request_ride($1)`, [(await quote(P1)).id]),
  "passenger_has_active_ride"
)
const qExp = await quote(P2)
await db.query(
  `update public.ride_quotes set expires_at = now() - interval '1 minute' where id=$1`,
  [qExp.id]
)
await expectErr(
  "cotação expirada é recusada",
  as("authenticated", P2, `select public.request_ride($1)`, [qExp.id]),
  "quote_expired"
)

// --- visibilidade da solicitação
const seen = async (uid) =>
  (await as("authenticated", uid, `select count(*)::int n from public.rides`)).rows[0].n
ok("motorista online vê a solicitação", (await seen(D1)) === 1)
ok("motorista não aprovado não vê", (await seen(D3)) === 0)
ok("outro passageiro não vê", (await seen(P2)) === 0)
r = await as(
  "authenticated",
  D1,
  `select count(*)::int n from public.profiles where id=$1`,
  [P1]
)
ok("antes do aceite, motorista não vê dados do passageiro", r.rows[0].n === 0)

// --- accept_ride
await expectErr(
  "não aprovado não aceita",
  as("authenticated", D3, `select public.accept_ride($1)`, [ride.id]),
  "driver_not_approved"
)
await expectErr(
  "passageiro não aceita",
  as("authenticated", P2, `select public.accept_ride($1)`, [ride.id]),
  "driver_not_approved"
)
ride = (await as("authenticated", D1, `select * from public.accept_ride($1)`, [ride.id]))
  .rows[0]
ok(
  "primeiro motorista aceita",
  ride.status === "accepted" && ride.driver_id === D1 && ride.accepted_at !== null
)
await expectErr(
  "segundo motorista recebe ride_not_available",
  as("authenticated", D2, `select public.accept_ride($1)`, [ride.id]),
  "ride_not_available"
)
ok("motorista perdedor deixa de ver a corrida", (await seen(D2)) === 0)
r = await as(
  "authenticated",
  D1,
  `select full_name, phone from public.profiles where id=$1`,
  [P1]
)
ok("depois do aceite, motorista vê o passageiro", r.rows[0]?.full_name === "Ana Lima")
r = await as(
  "authenticated",
  P1,
  `select p.full_name from public.drivers d join public.profiles p on p.id=d.id where d.id=$1`,
  [D1]
)
ok("passageiro vê o motorista da sua corrida", r.rows[0]?.full_name === "Caio")
await expectErr(
  "motorista em corrida não fica offline",
  as("authenticated", D1, `select public.set_driver_online(false)`),
  "driver_has_active_ride"
)

// motorista com corrida ativa não aceita outra
const ride2 = (
  await as("authenticated", P2, `select * from public.request_ride($1)`, [
    (await quote(P2)).id,
  ])
).rows[0]
await expectErr(
  "motorista com corrida ativa não aceita outra",
  as("authenticated", D1, `select public.accept_ride($1)`, [ride2.id]),
  "driver_has_active_ride"
)

// --- transições
const adv = (uid, id, to) =>
  as("authenticated", uid, `select * from public.advance_ride_status($1,$2)`, [id, to])
await expectErr(
  "não pula etapa (accepted -> in_progress)",
  adv(D1, ride.id, "in_progress"),
  "invalid_transition"
)
await expectErr(
  "não pula etapa (accepted -> completed)",
  adv(D1, ride.id, "completed"),
  "invalid_transition"
)
await expectErr(
  "status inventado é recusado",
  adv(D1, ride.id, "requested"),
  "invalid_transition"
)
await expectErr(
  "outro motorista não avança",
  adv(D2, ride.id, "arrived"),
  "ride_not_found"
)
await expectErr("passageiro não avança", adv(P1, ride.id, "arrived"), "ride_not_found")
ride = (await adv(D1, ride.id, "arrived")).rows[0]
ride = (await adv(D1, ride.id, "in_progress")).rows[0]
await expectErr(
  "não cancela depois de iniciada",
  as("authenticated", P1, `select public.cancel_ride($1)`, [ride.id]),
  "ride_not_cancellable"
)
ride = (await adv(D1, ride.id, "completed")).rows[0]
ok(
  "fluxo completo grava todos os timestamps",
  ride.status === "completed" &&
    ride.accepted_at &&
    ride.arrived_at &&
    ride.started_at &&
    ride.completed_at
)
await expectErr(
  "corrida concluída não avança",
  adv(D1, ride.id, "completed"),
  "invalid_transition"
)

// --- cancelamento
await expectErr(
  "terceiro não cancela",
  as("authenticated", P1, `select public.cancel_ride($1)`, [ride2.id]),
  "ride_not_found"
)
r = await as("authenticated", P2, `select * from public.cancel_ride($1, $2)`, [
  ride2.id,
  "  mudei de ideia  ",
])
ok(
  "passageiro cancela solicitação",
  r.rows[0].status === "cancelled" &&
    r.rows[0].cancelled_by === P2 &&
    r.rows[0].cancel_reason === "mudei de ideia"
)
await expectErr(
  "cancelada não é aceita",
  as("authenticated", D2, `select public.accept_ride($1)`, [ride2.id]),
  "ride_not_available"
)
const ride3 = (
  await as("authenticated", P2, `select * from public.request_ride($1)`, [
    (await quote(P2)).id,
  ])
).rows[0]
ok("depois de cancelar, passageiro pede de novo", ride3.status === "requested")
await as("authenticated", D2, `select public.accept_ride($1)`, [ride3.id])
r = await as("authenticated", D2, `select * from public.cancel_ride($1)`, [ride3.id])
ok(
  "motorista cancela corrida aceita",
  r.rows[0].status === "cancelled" && r.rows[0].cancelled_by === D2
)

// --- histórico
ok("histórico: passageiro 1 vê 1 corrida", (await seen(P1)) === 1)
ok("histórico: motorista 1 vê só a sua", (await seen(D1)) === 1)
ok("histórico: passageiro 2 vê as 2 suas", (await seen(P2)) === 2)
ok(
  "motorista offline não vê solicitações abertas",
  (await (async () => {
    await as("authenticated", D1, `select public.set_driver_online(false)`)
    const q = await quote(P1)
    await as("authenticated", P1, `select public.request_ride($1)`, [q.id])
    return seen(D1)
  })()) === 1
)

console.log(`\n${pass} passaram, ${fail} falharam`)
process.exit(fail ? 1 : 0)
