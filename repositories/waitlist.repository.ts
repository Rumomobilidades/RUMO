import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/types/database.types"

type WaitlistInsert = Database["public"]["Tables"]["waitlist"]["Insert"]

export class WaitlistDuplicateEmailError extends Error {
  constructor() {
    super("Este e-mail já está cadastrado na lista.")
    this.name = "WaitlistDuplicateEmailError"
  }
}

/**
 * Único ponto de acesso à tabela `waitlist`. Não conhece regra de negócio —
 * só sabe gravar a linha e traduzir erros do Postgres em erros de domínio.
 * Próximos módulos (drivers, rides, ...) repetem este padrão: um repository
 * por tabela, service por cima orquestrando.
 */
export async function insertWaitlistRow(
  supabase: SupabaseClient<Database>,
  row: WaitlistInsert
) {
  const { data, error } = await supabase
    .from("waitlist")
    .insert(row)
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      throw new WaitlistDuplicateEmailError()
    }
    throw error
  }

  return data
}
