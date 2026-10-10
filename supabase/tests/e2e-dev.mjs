// Teste de ponta a ponta contra o projeto Supabase de DESENVOLVIMENTO, pela
// mesma API que o app usa (supabase-js): cadastro real, cotação, pedido,
// disputa de dois motoristas em paralelo, Realtime, estados e histórico.
//
// Rodar: pnpm test:e2e   (exige `supabase login` e a pasta vinculada ao rumo-dev)
//
// Recusa rodar se o projeto vinculado não se chamar "rumo-dev". As chaves são
// lidas da CLI em tempo de execução — nada fica em disco. Cria usuários de
// teste (@example.com) e apaga tudo que criou no final.
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const cli = (...args) => {
  const out = execFileSync("supabase", [...args, "--output-format", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  })
  return JSON.parse(
    out.slice(Math.min(...["{", "["].map((c) => out.indexOf(c)).filter((i) => i >= 0)))
  )
}

const ref = readFileSync(
  fileURLToPath(new URL("../.temp/project-ref", import.meta.url)),
  "utf8"
).trim()
const project = cli("projects", "list").projects.find((p) => p.ref === ref)
if (project?.name !== "rumo-dev") {
  console.error(
    `Abortado: o projeto vinculado é "${project?.name ?? ref}", não "rumo-dev".`
  )
  process.exit(2)
}

const keysOut = cli("projects", "api-keys", "--project-ref", ref)
const keys = Array.isArray(keysOut) ? keysOut : keysOut.keys
const url = `https://${ref}.supabase.co`
const publishable = keys.find((k) => k.type === "publishable").api_key
// A CLI devolve a chave `sb_secret_` mascarada; a service_role legada vem inteira.
const secret = keys.find((k) => k.name === "service_role").api_key

const admin = createClient(url, secret, { auth: { persistSession: false } })
const newClient = () =>
  createClient(url, publishable, { auth: { persistSession: false } })

let pass = 0
let fail = 0
const ok = (name, cond, extra = "") => {
  if (cond) pass++
  else fail++
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  -> " + extra : ""}`)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const run = Date.now()
const created = []

async function signUp(label, role) {
  const client = newClient()
  const { data, error } = await client.auth.signUp({
    email: `e2e-${run}-${label}@example.com`,
    password: `Teste-${run}-${label}`,
    options: { data: { full_name: `E2E ${label}`, phone: "47999990000", role } },
  })
  if (error || !data.session)
    throw new Error(`signUp ${label}: ${error?.message ?? "sem sessão"}`)
  created.push(data.user.id)
  return { client, id: data.user.id }
}

try {
  // --- cadastro pelo fluxo real
  const ana = await signUp("ana", "passageiro")
  const caio = await signUp("caio", "motorista")
  const davi = await signUp("davi", "motorista")

  let r = await ana.client
    .from("profiles")
    .select("role, full_name")
    .eq("id", ana.id)
    .single()
  ok(
    "cadastro cria profile de passageiro",
    r.data?.role === "passageiro",
    r.error?.message
  )
  r = await caio.client
    .from("drivers")
    .select("approval_status, is_online")
    .eq("id", caio.id)
    .single()
  ok(
    "cadastro de motorista nasce pendente e offline",
    r.data?.approval_status === "pending" && r.data?.is_online === false,
    r.error?.message
  )

  // --- bloqueios
  r = await caio.client.rpc("set_driver_online", { p_online: true })
  ok(
    "motorista pendente não fica online",
    r.error?.message === "driver_not_approved",
    r.error?.message
  )
  r = await caio.client
    .from("drivers")
    .update({ approval_status: "approved" })
    .eq("id", caio.id)
    .select()
  ok(
    "motorista não se autoaprova",
    Boolean(r.error) || r.data?.length === 0,
    r.error?.message
  )
  r = await ana.client.from("rides").insert({ passenger_id: ana.id }).select()
  ok("passageiro não insere corrida direto", Boolean(r.error), r.error?.message)
  r = await ana.client.rpc("create_ride_quote", {
    p_passenger_id: ana.id,
    p_origin_address: "a",
    p_origin_lat: 0,
    p_origin_lng: 0,
    p_destination_address: "b",
    p_destination_lat: 0,
    p_destination_lng: 0,
    p_distance_m: 1000,
    p_duration_s: 60,
  })
  ok("passageiro não cria a própria cotação", Boolean(r.error), r.error?.message)

  // --- aprovação (o que o Junior fará pelo dashboard) e online
  r = await admin
    .from("drivers")
    .update({ approval_status: "approved" })
    .in("id", [caio.id, davi.id])
    .select("id")
  ok("aprovação via service role", r.data?.length === 2, r.error?.message)
  for (const d of [caio, davi]) {
    r = await d.client.rpc("set_driver_online", { p_online: true })
    if (r.error) throw new Error("online: " + r.error.message)
  }
  ok("motoristas aprovados ficam online", true)

  // --- estimativa real: Edge Function (endereço -> rota -> cotação)
  const estimate = (client, body) => client.functions.invoke("estimate-ride", { body })
  const errorCode = async (res) =>
    res.error ? (await res.error.context?.json?.().catch(() => null))?.error : null

  r = await newClient().functions.invoke("estimate-ride", {
    body: {
      origin: "Rua XV de Novembro, Blumenau",
      destination: "Rua 7 de Setembro, Blumenau",
    },
  })
  ok(
    "estimativa exige login",
    (await errorCode(r)) === "not_authenticated",
    await errorCode(r)
  )
  r = await estimate(caio.client, {
    origin: "Rua XV de Novembro, Blumenau",
    destination: "Rua 7 de Setembro, Blumenau",
  })
  ok(
    "motorista não pede estimativa",
    (await errorCode(r)) === "not_a_passenger",
    await errorCode(r)
  )
  await sleep(1200)
  r = await estimate(ana.client, {
    origin: "zzqx endereço inexistente 99999 qwxz",
    destination: "Rua 7 de Setembro, Blumenau",
  })
  ok(
    "endereço inexistente é recusado",
    (await errorCode(r)) === "origin_not_found",
    await errorCode(r)
  )
  await sleep(1200)
  r = await estimate(ana.client, {
    origin: "Rua XV de Novembro, 100, Blumenau SC",
    destination: "Rua Bahia, 2000, Blumenau SC",
  })
  const quote = r.data?.quote
  const expected =
    quote &&
    Math.max(
      800,
      400 +
        Math.round((180 * quote.distance_m) / 1000) +
        Math.round((30 * quote.duration_s) / 60)
    )
  ok(
    "estimativa com rota real e preço calculado no servidor",
    Boolean(quote) &&
      quote.distance_m > 500 &&
      quote.duration_s > 30 &&
      quote.price_cents === expected,
    quote
      ? `${quote.distance_m} m, ${quote.duration_s} s, ${quote.price_cents} centavos`
      : await errorCode(r)
  )
  if (!quote) throw new Error("sem cotação")

  // --- Realtime: motorista online escuta solicitações novas
  const driverSeen = []
  const driverChannel = davi.client
    .channel("requests-e2e")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "rides" }, (p) =>
      driverSeen.push(p.new.id)
    )
    .subscribe()

  // --- Realtime: passageiro escuta a própria corrida
  const seen = []
  const channel = ana.client
    .channel("ride-e2e")
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rides" }, (p) =>
      seen.push(p.new.status)
    )
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Realtime não conectou em 15s")), 15000)
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(t)
        resolve()
      }
    })
  })

  // "SUBSCRIBED" chega antes de o servidor começar a entregar mudanças do
  // banco; sem esta espera os primeiros eventos se perdem. No app, sempre
  // buscar o estado atual depois de assinar, em vez de confiar só nos eventos.
  await sleep(4000)

  // --- pedido
  r = await ana.client.rpc("request_ride", { p_quote_id: quote.id })
  const ride = r.data
  ok(
    "passageiro pede a corrida",
    ride?.status === "requested" && ride?.estimated_price_cents === quote.price_cents,
    r.error?.message
  )
  r = await caio.client.from("rides").select("id").eq("status", "requested")
  ok(
    "motorista online vê a solicitação",
    r.data?.some((x) => x.id === ride.id),
    r.error?.message
  )

  await sleep(2500)
  ok(
    "Realtime avisa o motorista online da nova solicitação",
    driverSeen.includes(ride.id),
    `${driverSeen.length} eventos`
  )
  await davi.client.removeChannel(driverChannel)

  // --- disputa REAL: dois motoristas aceitam ao mesmo tempo
  const [a, b] = await Promise.all([
    caio.client.rpc("accept_ride", { p_ride_id: ride.id }),
    davi.client.rpc("accept_ride", { p_ride_id: ride.id }),
  ])
  const winners = [a, b].filter((x) => !x.error)
  const losers = [a, b].filter((x) => x.error)
  ok(
    "aceite simultâneo: exatamente um vence",
    winners.length === 1 && losers.length === 1,
    `${winners.length} venceram`
  )
  ok(
    "perdedor recebe ride_not_available",
    losers[0]?.error?.message === "ride_not_available",
    losers[0]?.error?.message
  )
  const driver = a.error ? davi : caio
  const loser = a.error ? caio : davi

  r = await ana.client
    .from("profiles")
    .select("full_name")
    .eq("id", driver.id)
    .maybeSingle()
  ok("passageiro vê o nome do motorista", Boolean(r.data?.full_name), r.error?.message)
  r = await loser.client.from("rides").select("id").eq("id", ride.id)
  ok("motorista perdedor não vê mais a corrida", r.data?.length === 0, r.error?.message)

  // --- estados
  r = await driver.client.rpc("advance_ride_status", {
    p_ride_id: ride.id,
    p_to: "completed",
  })
  ok("não pula etapas", r.error?.message === "invalid_transition", r.error?.message)
  for (const to of ["arrived", "in_progress", "completed"]) {
    r = await driver.client.rpc("advance_ride_status", { p_ride_id: ride.id, p_to: to })
    if (r.error) throw new Error(`${to}: ${r.error.message}`)
  }
  const done = r.data
  ok(
    "corrida concluída com todos os timestamps",
    done.status === "completed" &&
      done.accepted_at &&
      done.arrived_at &&
      done.started_at &&
      done.completed_at
  )

  await sleep(4000)
  ok(
    "Realtime entregou as 4 mudanças ao passageiro",
    ["accepted", "arrived", "in_progress", "completed"].every((s) => seen.includes(s)),
    seen.join(",")
  )
  await ana.client.removeChannel(channel)

  // --- histórico
  r = await ana.client.from("rides").select("status").eq("id", ride.id).single()
  ok("histórico do passageiro", r.data?.status === "completed", r.error?.message)
  r = await driver.client.from("rides").select("status").eq("id", ride.id).single()
  ok("histórico do motorista", r.data?.status === "completed", r.error?.message)
} catch (e) {
  fail++
  console.log("FAIL  erro inesperado  ->", e.message)
} finally {
  // limpeza: usuários deste teste e sobras de execuções interrompidas
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const stale = (list?.users ?? []).filter((u) =>
    /^e2e-\d+-[a-z]+@example\.com$/.test(u.email ?? "")
  )
  const ids = [...new Set([...created, ...stale.map((u) => u.id)])]
  await admin.from("rides").delete().in("passenger_id", ids)
  await admin.from("ride_quotes").delete().in("passenger_id", ids)
  let removed = 0
  for (const id of ids) if (!(await admin.auth.admin.deleteUser(id)).error) removed++
  console.log(`limpeza: ${removed}/${ids.length} usuários de teste removidos`)
}

console.log(`\n${pass} passaram, ${fail} falharam`)
process.exit(fail ? 1 : 0)
