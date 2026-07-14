import { z } from "zod"

export const WAITLIST_PROFILES = ["passageiro", "motorista", "empresa"] as const
export type WaitlistProfile = (typeof WAITLIST_PROFILES)[number]

/**
 * Fonte única de validação — usada tanto pelo formulário (client, via
 * react-hook-form) quanto pela Route Handler (server, antes de gravar no
 * Supabase). Nunca duplicar essas regras em outro lugar.
 */
export const waitlistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Digite seu nome completo.")
    .max(120, "Nome muito longo."),
  email: z.string().trim().toLowerCase().email("Digite um e-mail válido."),
  phone: z
    .string()
    .trim()
    .min(10, "Digite um WhatsApp válido com DDD.")
    .max(20, "Número muito longo."),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(2).optional().or(z.literal("")),
  profile: z.enum(WAITLIST_PROFILES).optional(),
  lgpd_consent: z.boolean().refine((value) => value === true, {
    message: "É necessário autorizar o uso dos seus dados para continuar.",
  }),
  landing: z.string().trim().max(300).optional(),
  referrer: z.string().trim().max(500).optional(),
  utm_source: z.string().trim().max(200).optional(),
  utm_medium: z.string().trim().max(200).optional(),
  utm_campaign: z.string().trim().max(200).optional(),
  utm_content: z.string().trim().max(200).optional(),
  utm_term: z.string().trim().max(200).optional(),
  fbclid: z.string().trim().max(300).optional(),
  gclid: z.string().trim().max(300).optional(),
  // honeypot: campo invisível para humanos. Sem limite de tamanho aqui de
  // propósito — se houvesse `.max(0)`, um bot preenchendo o campo faria a
  // validação falhar com 400 antes de chegar na Route Handler, que é quem
  // precisa ver o valor preenchido para responder com sucesso falso (ver
  // app/api/waitlist/route.ts).
  website: z.string().optional().or(z.literal("")),
})

export type WaitlistFormValues = z.infer<typeof waitlistSchema>

export type WaitlistApiResponse =
  | { success: true; data: { id: string } }
  | { success: false; error: { code: string; message: string } }
