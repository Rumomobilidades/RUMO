// Códigos lançados pelas funções de supabase/migrations/0004_ride_rpcs.sql.
const RULE_MESSAGES: Record<string, string> = {
  not_authenticated: 'Sua sessão expirou. Entre novamente.',
  not_a_passenger: 'Só passageiros podem pedir corrida.',
  quote_not_found: 'Estimativa não encontrada. Calcule de novo.',
  quote_expired: 'A estimativa expirou. Calcule de novo.',
  quote_already_used: 'Essa estimativa já foi usada.',
  passenger_has_active_ride: 'Você já tem uma corrida em andamento.',
  driver_not_approved: 'Seu cadastro de motorista ainda não foi aprovado.',
  driver_offline: 'Fique online para aceitar corridas.',
  driver_has_active_ride: 'Finalize a corrida atual antes.',
  ride_not_available: 'Essa corrida já foi aceita por outro motorista ou cancelada.',
  ride_not_found: 'Corrida não encontrada.',
  invalid_transition: 'Essa ação não é possível no estado atual da corrida.',
  ride_not_cancellable: 'Essa corrida não pode mais ser cancelada.',
  // Códigos da Edge Function estimate-ride.
  origin_required: 'Informe o endereço de origem.',
  destination_required: 'Informe o endereço de destino.',
  origin_not_found: 'Não encontramos o endereço de origem. Inclua rua, número e cidade.',
  destination_not_found: 'Não encontramos o endereço de destino. Inclua rua, número e cidade.',
  route_not_found: 'Não encontramos uma rota de carro entre esses endereços.',
  route_too_short: 'Origem e destino estão próximos demais.',
  route_too_long: 'Essa distância está acima do limite atendido.',
  maps_unavailable: 'O serviço de mapas não respondeu. Tente de novo em instantes.',
  query_too_short: 'Digite pelo menos 3 letras.',
  no_categories: 'Nenhuma categoria de viagem disponível no momento.',
  category_not_found: 'Essa categoria não está mais disponível.',
  internal_error: 'Erro no servidor. Tente novamente.',
};

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
  user_already_exists: 'Já existe uma conta com esse e-mail.',
  weak_password: 'Escolha uma senha mais forte.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde um pouco.',
};

/** Traduz erro do Supabase (auth, RPC ou rede) para uma mensagem em português. */
export function describeError(error: unknown): string {
  const e = error as { message?: string; code?: string } | null;
  if (e?.code && AUTH_MESSAGES[e.code]) return AUTH_MESSAGES[e.code];
  if (e?.message && RULE_MESSAGES[e.message]) return RULE_MESSAGES[e.message];
  if (e?.message && /network request failed|failed to fetch/i.test(e.message)) {
    return 'Sem conexão com o servidor. Verifique sua internet.';
  }
  return e?.message ?? 'Algo deu errado. Tente novamente.';
}
