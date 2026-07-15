import { z } from "zod"

export const WAITLIST_PROFILES = ["passageiro", "motorista", "empresa"] as const
export type WaitlistProfile = (typeof WAITLIST_PROFILES)[number]

/**
 * String opcional que trata null/undefined/"" como "não informado". Usa
 * `.nullish().transform()` em vez de `.optional().or(z.literal(""))`: essa
 * segunda forma cria uma união de dois ramos e, quando o valor recebido não
 * bate em nenhum (ex.: `null`), o Zod não sabe apontar qual ramo falhou e
 * devolve só "Invalid input", sem indicar o campo. `.nullish()` é um
 * wrapper único — sempre reporta o campo e a causa certos.
 */
function optionalString(max?: number, message?: string) {
  const base = z.string().trim()
  const bounded = max === undefined ? base : base.max(max, message)
  return bounded.nullish().transform((value) => (value ? value : undefined))
}

/**
 * Fonte única de validação — usada tanto pelo formulário (client, via
 * react-hook-form) quanto pela Route Handler (server, antes de gravar no
 * Supabase). Nunca duplicar essas regras em outro lugar.
 */
export const waitlistSchema = z.object({
  name: z
    .string({ message: "Nome é obrigatório." })
    .trim()
    .min(2, "Digite seu nome completo.")
    .max(120, "Nome muito longo."),
  email: z
    .string({ message: "E-mail é obrigatório." })
    .trim()
    .toLowerCase()
    .email("Digite um e-mail válido."),
  phone: z
    .string({ message: "Telefone é obrigatório." })
    .trim()
    .min(10, "Digite um WhatsApp válido com DDD.")
    .max(20, "Número muito longo."),
  city: optionalString(80, "Cidade muito longa."),
  state: optionalString(2, "UF inválida — use a sigla (ex.: SC)."),
  profile: z
    .enum(WAITLIST_PROFILES, { message: "Selecione um perfil válido." })
    .nullish()
    .transform((value) => (value ? value : undefined)),
  lgpd_consent: z
    .boolean({ message: "É necessário autorizar o uso dos seus dados para continuar." })
    .refine((value) => value === true, {
      message: "É necessário autorizar o uso dos seus dados para continuar.",
    }),
  landing: optionalString(300),
  referrer: optionalString(500),
  utm_source: optionalString(200),
  utm_medium: optionalString(200),
  utm_campaign: optionalString(200),
  utm_content: optionalString(200),
  utm_term: optionalString(200),
  fbclid: optionalString(300),
  gclid: optionalString(300),
  // honeypot: campo invisível para humanos. Sem limite de tamanho aqui de
  // propósito — se houvesse `.max(0)`, um bot preenchendo o campo faria a
  // validação falhar com 400 antes de chegar na Route Handler, que é quem
  // precisa ver o valor preenchido para responder com sucesso falso (ver
  // app/api/waitlist/route.ts).
  website: optionalString(),
})

/**
 * `city`/`state`/`profile`/etc. usam `.nullish().transform()`, então o tipo
 * de entrada (o que o formulário guarda antes de validar) difere do tipo de
 * saída (o que sobra depois do Zod normalizar `null`/"" para `undefined`).
 * `useForm` precisa dos dois — ver a assinatura de 3 genéricos em
 * `use-waitlist-form.ts`.
 */
export type WaitlistFormInput = z.input<typeof waitlistSchema>
export type WaitlistFormValues = z.output<typeof waitlistSchema>

/** Uma issue do Zod já simplificada para o client: campo + mensagem final. */
export type WaitlistValidationIssue = { path: string; message: string }

export type WaitlistApiResponse =
  | { success: true; data: { id: string } }
  | {
      success: false
      error: { code: string; message: string }
      issues?: WaitlistValidationIssue[]
    }
