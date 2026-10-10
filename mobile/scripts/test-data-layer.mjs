// Testa a camada de dados REAL do app (src/lib/rides.ts) contra o rumo-dev:
// as mesmas funções, colunas e filtros que as telas usam, em um fluxo completo
// de corrida com um passageiro e dois motoristas.
//
// Rodar: npm run test:data   (exige `supabase login` e a pasta vinculada ao rumo-dev)
//
// O módulo é empacotado com esbuild trocando só `@/lib/supabase` por um
// cliente Node cuja sessão alternamos entre os usuários de teste. Recusa
// rodar fora do rumo-dev e apaga o que cria.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createClient } from '@supabase/supabase-js';

const mobile = fileURLToPath(new URL('..', import.meta.url));
const cli = (...args) => {
  const out = execFileSync('supabase', [...args, '--output-format', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return JSON.parse(out.slice(Math.min(...['{', '['].map((c) => out.indexOf(c)).filter((i) => i >= 0))));
};

const ref = readFileSync(join(mobile, '../supabase/.temp/project-ref'), 'utf8').trim();
const project = cli('projects', 'list').projects.find((p) => p.ref === ref);
if (project?.name !== 'rumo-dev') {
  console.error(`Abortado: o projeto vinculado é "${project?.name ?? ref}", não "rumo-dev".`);
  process.exit(2);
}

const env = Object.fromEntries(
  readFileSync(join(mobile, '.env'), 'utf8')
    .split('\n')
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const publicKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url.includes(ref)) {
  console.error('Abortado: mobile/.env não aponta para o projeto vinculado.');
  process.exit(2);
}

const keysOut = cli('projects', 'api-keys', '--project-ref', ref);
const keys = Array.isArray(keysOut) ? keysOut : keysOut.keys;
const admin = createClient(url, keys.find((k) => k.name === 'service_role').api_key, {
  auth: { persistSession: false },
});

// --- empacota src/lib/rides.ts com o cliente trocado
const dir = mkdtempSync(join(tmpdir(), 'rumo-data-'));
const stub = join(dir, 'supabase-stub.mjs');
// O stub é embutido no pacote, então a sessão ativa passa por uma variável global.
writeFileSync(
  stub,
  `export const supabase = new Proxy({}, { get: (_, key) => globalThis.__rumoClient[key] });`,
);
const useClient = (client) => {
  globalThis.__rumoClient = client;
};
const bundle = join(dir, 'rides.mjs');
execFileSync(
  'npx',
  ['--yes', 'esbuild', join(mobile, 'src/lib/rides.ts'), '--bundle', '--format=esm', '--platform=node',
    `--alias:@/lib/supabase=${stub}`, `--alias:@=${join(mobile, 'src')}`, `--outfile=${bundle}`, '--log-level=error'],
  { stdio: 'inherit' },
);
const app = await import(pathToFileURL(bundle).href);

let pass = 0;
let fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  -> ' + extra : ''}`);
};
const code = async (promise) => {
  try {
    await promise;
    return null;
  } catch (e) {
    return e.message;
  }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = Date.now();
const created = [];

async function signUp(label, role) {
  const client = createClient(url, publicKey, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signUp({
    email: `e2e-${run}-${label}@example.com`,
    password: `Teste-${run}-${label}`,
    options: { data: { full_name: `Dados ${label}`, phone: '(47) 99999-0000', role } },
  });
  if (error || !data.session) throw new Error(`signUp ${label}: ${error?.message ?? 'sem sessão'}`);
  created.push(data.user.id);
  return { id: data.user.id, as: () => useClient(client) };
}

try {
  const ana = await signUp('ana', 'passageiro');
  const caio = await signUp('caio', 'motorista');
  const davi = await signUp('davi', 'motorista');

  // --- motorista: cadastro, veículo, online
  caio.as();
  let driver = await app.fetchDriver(caio.id);
  ok('fetchDriver: pendente e offline', driver?.approval_status === 'pending' && driver?.is_online === false);
  ok('setDriverOnline recusado antes da aprovação', (await code(app.setDriverOnline(true))) === 'driver_not_approved');
  driver = await app.updateVehicle(caio.id, ' Onix prata ', 'abc1d23');
  ok('updateVehicle salva modelo e placa', driver.vehicle_model === 'Onix prata' && driver.vehicle_plate === 'ABC1D23');
  ok('fetchOpenRequests vazio para motorista offline', (await app.fetchOpenRequests()).length === 0);

  await admin.from('drivers').update({ approval_status: 'approved' }).in('id', [caio.id, davi.id]);
  driver = await app.setDriverOnline(true);
  ok('setDriverOnline depois da aprovação', driver.is_online === true);
  davi.as();
  await app.setDriverOnline(true);

  // --- passageiro: estimativa e pedido
  ana.as();
  ok('fetchLatestRide: passageiro sem corrida', (await app.fetchLatestRide(ana.id, 'passageiro')) === null);
  ok('fetchHistory vazio', (await app.fetchHistory(ana.id, 'passageiro')).length === 0);
  ok('estimateRide: endereço inexistente', (await code(app.estimateRide('zzqx inexistente 99999 qwxz', 'Rua Bahia, Blumenau'))) === 'origin_not_found');
  await sleep(1200);
  const quote = await app.estimateRide('Rua XV de Novembro, Blumenau SC', 'Rua Bahia, 2000, Blumenau SC');
  ok('estimateRide devolve cotação real', quote.distance_m > 500 && quote.price_cents >= 800, `${quote.distance_m} m, ${quote.price_cents} centavos`);
  let ride = await app.requestRide(quote.id);
  ok('requestRide cria a corrida', ride.status === 'requested');
  ok('requestRide de novo com a mesma cotação', (await code(app.requestRide(quote.id))) === 'quote_already_used');
  let view = await app.fetchLatestRide(ana.id, 'passageiro');
  ok('passageiro vê a corrida solicitada, sem motorista', view?.ride.id === ride.id && view.counterpart === null);

  // --- motorista: lista e aceite
  caio.as();
  const open = await app.fetchOpenRequests();
  ok('fetchOpenRequests mostra a solicitação', open.some((r) => r.id === ride.id));
  ok('motorista ainda sem corrida própria', (await app.fetchLatestRide(caio.id, 'motorista')) === null);
  ride = await app.acceptRide(ride.id);
  ok('acceptRide', ride.status === 'accepted' && ride.driver_id === caio.id);
  view = await app.fetchLatestRide(caio.id, 'motorista');
  ok('motorista vê nome e telefone do passageiro', view?.counterpart?.full_name === 'Dados ana' && Boolean(view.counterpart.phone));
  ok('lista de solicitações esvazia depois do aceite', !(await app.fetchOpenRequests()).some((r) => r.id === ride.id));

  davi.as();
  ok('segundo motorista: ride_not_available', (await code(app.acceptRide(ride.id))) === 'ride_not_available');
  ok('segundo motorista não vê a corrida', (await app.fetchLatestRide(davi.id, 'motorista')) === null);

  ana.as();
  view = await app.fetchLatestRide(ana.id, 'passageiro');
  ok(
    'passageiro vê motorista, telefone e veículo',
    view?.counterpart?.full_name === 'Dados caio' && view.counterpart.vehicle_plate === 'ABC1D23' && Boolean(view.counterpart.phone),
  );

  // --- estados
  caio.as();
  ok('não pula etapa', (await code(app.advanceRide(ride.id, 'in_progress'))) === 'invalid_transition');
  ok('motorista em corrida não fica offline', (await code(app.setDriverOnline(false))) === 'driver_has_active_ride');
  await app.advanceRide(ride.id, 'arrived');
  await app.advanceRide(ride.id, 'in_progress');
  ana.as();
  view = await app.fetchLatestRide(ana.id, 'passageiro');
  ok('passageiro acompanha: em viagem', view?.ride.status === 'in_progress');
  ok('passageiro não cancela em viagem', (await code(app.cancelRide(ride.id))) === 'ride_not_cancellable');
  caio.as();
  ride = await app.advanceRide(ride.id, 'completed');
  ok('corrida concluída', ride.status === 'completed' && Boolean(ride.completed_at));

  // --- histórico dos dois lados
  ok('histórico do motorista', (await app.fetchHistory(caio.id, 'motorista')).some((r) => r.id === ride.id));
  ana.as();
  ok('histórico do passageiro', (await app.fetchHistory(ana.id, 'passageiro')).some((r) => r.id === ride.id));
  view = await app.fetchLatestRide(ana.id, 'passageiro');
  ok('passageiro vê a conclusão com dados do motorista', view?.ride.status === 'completed' && view.counterpart?.full_name === 'Dados caio');

  // --- cancelamento pelo passageiro depois do aceite
  await sleep(1200);
  const quote2 = await app.estimateRide('Rua Bahia, Blumenau SC', 'Rua XV de Novembro, Blumenau SC');
  let ride2 = await app.requestRide(quote2.id);
  davi.as();
  await app.acceptRide(ride2.id);
  ana.as();
  ride2 = await app.cancelRide(ride2.id, 'teste');
  ok('passageiro cancela corrida aceita', ride2.status === 'cancelled' && ride2.cancelled_by === ana.id);
  davi.as();
  view = await app.fetchLatestRide(davi.id, 'motorista');
  ok('motorista vê que o passageiro cancelou', view?.ride.status === 'cancelled' && view.ride.cancelled_by === view.ride.passenger_id);
  ok('motorista não avança corrida cancelada', (await code(app.advanceRide(ride2.id, 'arrived'))) === 'invalid_transition');
} catch (e) {
  fail++;
  console.log('FAIL  erro inesperado  ->', e.message);
} finally {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const stale = (list?.users ?? []).filter((u) => /^e2e-\d+-[a-z]+@example\.com$/.test(u.email ?? ''));
  const ids = [...new Set([...created, ...stale.map((u) => u.id)])];
  await admin.from('rides').delete().in('passenger_id', ids);
  await admin.from('ride_quotes').delete().in('passenger_id', ids);
  let removed = 0;
  for (const id of ids) if (!(await admin.auth.admin.deleteUser(id)).error) removed++;
  console.log(`limpeza: ${removed}/${ids.length} usuários de teste removidos`);
}

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
