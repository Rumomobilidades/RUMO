// Corrida completa pela INTERFACE do app, com dois "celulares" (passageiro e
// motorista) num Chrome sem janela, contra o rumo-dev. Confere que as telas
// reagem em tempo real, sem recarregar, e que o estado sobrevive a um reload.
// Salva um print de cada estado em mobile/.ui-shots/.
//
// Rodar: npx expo start (em outro terminal) e depois npm run test:ui
//
// Usa a versão web do app, então o mapa não aparece (a biblioteca de mapas
// não roda em navegador): valida fluxo, estados e layout, não o mapa.
// Exige `supabase login`, a pasta vinculada ao rumo-dev e o Google Chrome.
// Cria usuários de teste (@example.com) e apaga o que criou. Não toca em
// solicitações de outras contas.
import { execFileSync } from "node:child_process"
import { readFileSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import puppeteer from "puppeteer-core"

import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("../..", import.meta.url)).replace(/\/$/, "")
const OUT = ROOT + "/mobile/.ui-shots/"
mkdirSync(OUT, { recursive: true })
const { createClient } = createRequire(ROOT + "/package.json")("@supabase/supabase-js")
const env = Object.fromEntries(
  readFileSync(ROOT + "/mobile/.env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
)
const url = env.EXPO_PUBLIC_SUPABASE_URL
const pub = env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const ref = readFileSync(ROOT + "/supabase/.temp/project-ref", "utf8").trim()
const project = JSON.parse(
  execFileSync("supabase", ["projects", "list", "--output-format", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).replace(/^[^\[{]*/, "")
).projects.find((p) => p.ref === ref)
if (project?.name !== "rumo-dev" || !url.includes(ref)) {
  console.error("Abortado: a pasta ou o mobile/.env não apontam para o rumo-dev.")
  process.exit(2)
}
const keysOut = JSON.parse(
  execFileSync(
    "supabase",
    ["projects", "api-keys", "--project-ref", ref, "--output-format", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
  ).replace(/^[^\[{]*/, "")
)
const keys = Array.isArray(keysOut) ? keysOut : keysOut.keys
const admin = createClient(url, keys.find((k) => k.name === "service_role").api_key, {
  auth: { persistSession: false },
})
const client = () => createClient(url, pub, { auth: { persistSession: false } })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const run = Date.now()
async function makeUser(label, role, name) {
  const c = client()
  const email = `e2e-${run}-${label}@example.com`,
    password = `Teste-${run}-${label}`
  const { data, error } = await c.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, phone: "(47) 99999-0000", role } },
  })
  if (error) throw error
  return { id: data.user.id, email, password, c }
}
async function cleanup() {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const ids = (list?.users ?? [])
    .filter((u) => /^e2e-\d+-[a-z]+@example\.com$/.test(u.email ?? ""))
    .map((u) => u.id)
  // Corridas de passageiros de teste somem; se um motorista de teste ficou preso
  // a uma corrida alheia, ela volta a "solicitada" em vez de ser apagada.
  await admin.from("rides").delete().in("passenger_id", ids)
  await admin.from("ride_quotes").delete().in("passenger_id", ids)
  let removed = 0
  for (const id of ids) if (!(await admin.auth.admin.deleteUser(id)).error) removed++
  return `${removed}/${ids.length} usuários de teste removidos`
}
async function launch() {
  return puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
    args: ["--no-first-run", "--hide-scrollbars"],
  })
}
async function phone(
  browser,
  { dark = false, geo = { latitude: -26.9187, longitude: -49.0661 } } = {}
) {
  const ctx = await browser.createBrowserContext()
  if (geo) await ctx.overridePermissions("http://localhost:8081", ["geolocation"])
  const page = await ctx.newPage()
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  if (geo) await page.setGeolocation(geo)
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: dark ? "dark" : "light" },
  ])
  page.errors = []
  page.on("pageerror", (e) => page.errors.push(String(e).slice(0, 200)))
  page.on("console", (m) => {
    if (m.type() === "error") page.errors.push(m.text().slice(0, 200))
  })
  return page
}
const shot = async (page, name) => {
  await sleep(700)
  await page.screenshot({ path: `${OUT}${name}.png` })
  console.log("print:", name)
}
async function tap(page, text, { exact = false, timeout = 15000 } = {}) {
  const h = await page.waitForFunction(
    (t, ex) => {
      const els = [
        ...document.querySelectorAll(
          '[role="button"],[role="radio"],[role="link"],a,button'
        ),
      ]
      return (
        els.find((e) => {
          const s = (e.getAttribute("aria-label") || e.textContent || "").trim()
          return ex ? s === t : s.includes(t)
        }) || null
      )
    },
    { timeout },
    text,
    exact
  )
  await h.asElement().click()
  await sleep(350)
}
async function fill(page, label, value) {
  const sel = `input[aria-label="${label}"],textarea[aria-label="${label}"]`
  await page.waitForSelector(sel, { timeout: 15000 })
  await page.click(sel, { clickCount: 3 })
  await page.type(sel, value, { delay: 5 })
}
const waitText = (page, text, timeout = 20000) =>
  page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text)
async function login(page, user) {
  await page.goto("http://localhost:8081/", {
    waitUntil: "networkidle2",
    timeout: 120000,
  })
  await fill(page, "E-mail", user.email)
  await fill(page, "Senha", user.password)
  await tap(page, "Entrar", { exact: true })
}

/**
 * Toca no botão `label` do cartão que contém o texto `near`. "Cartão" é o
 * menor bloco em volta do botão que tem UM ÚNICO botão com esse rótulo — se o
 * bloco englobar dois cartões, ele é descartado. Isso impede tocar no botão de
 * outra corrida que esteja na mesma lista.
 */
async function tapInCard(page, label, near, timeout = 20000) {
  const h = await page.waitForFunction(
    (l, n) => {
      const buttons = [...document.querySelectorAll('[role="button"]')].filter(
        (b) => (b.textContent || "").trim() === l
      )
      for (const b of buttons) {
        let el = b.parentElement
        while (el && buttons.filter((other) => el.contains(other)).length === 1) {
          if (el.innerText.includes(n)) return b
          el = el.parentElement
        }
      }
      return null
    },
    { timeout },
    label,
    near
  )
  await h.asElement().click()
  await sleep(350)
}

/** Solicitações abertas que NÃO são deste teste. Com elas na fila o teste não roda. */
async function foreignOpenRequests() {
  const { data: rides } = await admin
    .from("rides")
    .select("id, passenger_id")
    .eq("status", "requested")
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const testIds = new Set(
    (list?.users ?? [])
      .filter((u) => /^e2e-\d+-[a-z]+@example\.com$/.test(u.email ?? ""))
      .map((u) => u.id)
  )
  return (rides ?? []).filter((ride) => !testIds.has(ride.passenger_id)).length
}

// O motorista de teste enxerga TODAS as solicitações abertas do ambiente. Para
// nunca aceitar a corrida de outra conta, o teste só roda com a fila limpa.
const foreign = await foreignOpenRequests()
if (foreign > 0) {
  console.error(
    `Abortado: há ${foreign} solicitação(ões) aberta(s) de outras contas no rumo-dev. Cancele-as no app e rode de novo.`
  )
  process.exit(2)
}

const browser = await launch()
let failed = false
const steps = []
const step = async (name, fn) => {
  try {
    await fn()
    steps.push("ok   " + name)
  } catch (e) {
    steps.push("FALHA " + name + " -> " + e.message.slice(0, 120))
    throw e
  }
}
try {
  const ana = await makeUser("ana", "passageiro", "Ana Martins")
  const caio = await makeUser("caio", "motorista", "Caio Souza")
  const P = await phone(browser),
    D = await phone(browser, { geo: { latitude: -26.915, longitude: -49.07 } })
  await step("login passageiro", async () => {
    await login(P, ana)
    await waitText(P, "Para onde?")
  })
  await step("login motorista (pendente)", async () => {
    await login(D, caio)
    await waitText(D, "Cadastro em análise")
    await shot(D, "20-mot-pendente")
  })
  await step("aprovação reflete no app sem recarregar", async () => {
    await admin
      .from("drivers")
      .update({
        approval_status: "approved",
        vehicle_model: "Onix prata",
        vehicle_plate: "ABC1D23",
      })
      .eq("id", caio.id)
    await waitText(D, "Você está offline", 25000)
    await shot(D, "21-mot-offline")
  })
  await step("motorista fica online", async () => {
    await tap(D, "Ficar online")
    await waitText(D, "Ficar offline")
    await shot(D, "22-mot-online")
  })
  await step("passageiro busca e vê categorias", async () => {
    await tap(P, "Informar destino")
    await fill(P, "Destino", "Rua Bahia Blumenau")
    await waitText(P, "Santa Catarina")
    await tap(P, "Rua Bahia")
    await waitText(P, "Escolha uma viagem", 40000)
  })
  await step("passageiro confirma", async () => {
    await tap(P, "Confirmar RUMO")
    await waitText(P, "Procurando motorista", 20000)
    await shot(P, "23-pas-procurando")
  })
  await step("motorista recebe a solicitação sem recarregar", async () => {
    await waitText(D, "Rua Bahia", 20000)
    await shot(D, "24-mot-solicitacao")
  })
  await step("motorista aceita", async () => {
    await tapInCard(D, "Aceitar corrida", "Rua Bahia")
    const { data: taken } = await admin
      .from("rides")
      .select("passenger_id")
      .eq("driver_id", caio.id)
    if (taken?.length !== 1 || taken[0].passenger_id !== ana.id)
      throw new Error("o motorista de teste aceitou uma corrida que não é a do teste")
    await waitText(D, "A caminho do passageiro", 20000)
    await shot(D, "25-mot-a-caminho")
  })
  await step("passageiro vê motorista a caminho sem recarregar", async () => {
    await waitText(P, "Motorista a caminho", 20000)
    await waitText(P, "Caio Souza")
    await shot(P, "26-pas-a-caminho")
  })
  await step("motorista chega", async () => {
    await tap(D, "Cheguei ao local")
    await waitText(P, "Motorista chegou", 20000)
    await shot(P, "27-pas-chegou")
  })
  await step("viagem inicia", async () => {
    await tap(D, "Iniciar viagem")
    await waitText(P, "Em viagem", 20000)
    await shot(P, "28-pas-em-viagem")
    await shot(D, "29-mot-em-viagem")
  })
  await step("viagem finaliza", async () => {
    await tap(D, "Finalizar viagem")
    await waitText(P, "Você chegou", 20000)
    await shot(P, "30-pas-resumo")
    await waitText(D, "Viagem finalizada")
    await shot(D, "31-mot-resumo")
  })
  await step("estado sobrevive a recarregar", async () => {
    await P.reload({ waitUntil: "networkidle2" })
    await waitText(P, "Você chegou", 30000)
  })
  await step("histórico", async () => {
    await tap(P, "Concluir")
    await tap(P, "Abrir menu da conta")
    await sleep(600)
    await shot(P, "32-pas-menu")
    await tap(P, "Histórico de corridas")
    await waitText(P, "Concluída", 20000)
    await shot(P, "33-pas-historico")
  })
  console.log("erros P:", P.errors.slice(0, 4), "erros D:", D.errors.slice(0, 4))
} catch (e) {
  failed = true
  console.log("INTERROMPIDO:", e.message.slice(0, 160))
} finally {
  console.log(steps.join("\n"))
  console.log("limpeza:", await cleanup())
  await browser.close()
}
process.exit(failed ? 1 : 0)
