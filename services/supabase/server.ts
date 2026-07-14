import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { getPublicEnv } from "@/lib/env"
import type { Database } from "@/types/database.types"

/**
 * Client Supabase para uso em Server Components / Route Handlers que
 * precisam respeitar a sessão do usuário (RLS com auth.uid()). Ainda não há
 * autenticação implementada — este client já fica pronto para quando o
 * módulo de auth chegar, sem precisar recriar a camada de acesso a dados.
 */
export async function createSupabaseServerClient() {
  const env = getPublicEnv()
  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Chamado a partir de um Server Component sem permissão de escrita
            // em cookies — inofensivo enquanto o middleware cuidar do refresh.
          }
        },
      },
    }
  )
}
