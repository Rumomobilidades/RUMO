import { createClient } from "@supabase/supabase-js"

import { getServerEnv } from "@/lib/env"
import type { Database } from "@/types/database.types"

/**
 * Client com a service role key — ignora RLS. Uso restrito a Route Handlers
 * de servidor (nunca importar em código que roda no browser). É o único
 * client autorizado a gravar na tabela `waitlist`, que não tem policy
 * pública de insert.
 */
export function createSupabaseAdminClient() {
  const env = getServerEnv()

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
