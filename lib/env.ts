import { z } from "zod"

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: "NEXT_PUBLIC_SUPABASE_URL precisa ser a URL do seu projeto Supabase.",
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: "NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatório.",
  }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, {
    message: "SUPABASE_SERVICE_ROLE_KEY é obrigatório (usado apenas no servidor).",
  }),
})

/**
 * Só é chamado a partir de código server-side (route handlers, services).
 * Falha cedo, com mensagem clara, em vez de deixar o client do Supabase
 * quebrar depois com um erro genérico de rede/autenticação.
 */
export function getServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    throw new Error(
      `Variáveis de ambiente inválidas ou ausentes:\n${parsed.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n")}`
    )
  }

  return parsed.data
}

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

export function getPublicEnv() {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  if (!parsed.success) {
    throw new Error(
      `Variáveis de ambiente públicas do Supabase ausentes: ${parsed.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ")}`
    )
  }

  return parsed.data
}
