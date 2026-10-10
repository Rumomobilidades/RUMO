import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2"

import { MapsError } from "./maps.ts"

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Identifica o usuário pelo token enviado pelo app; lança 401 se não houver sessão válida. */
export async function requireUser(request: Request, admin: SupabaseClient) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) throw new MapsError("not_authenticated", 401)

  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new MapsError("not_authenticated", 401)
  return data.user
}

/** Envolve o handler com CORS, método e tradução de erros em { error: codigo }. */
export function serve(name: string, handler: (request: Request) => Promise<Response>) {
  Deno.serve(async (request) => {
    if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405)

    try {
      return await handler(request)
    } catch (error) {
      if (error instanceof MapsError) {
        if (error.detail) console.error(`[${name}] ${error.code} (${error.detail})`)
        return json({ error: error.code, detail: error.detail }, error.status)
      }
      console.error(`[${name}] erro inesperado:`, error)
      return json({ error: "internal_error" }, 500)
    }
  })
}
