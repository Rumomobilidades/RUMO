import "server-only"

import { createSupabaseAdminClient } from "@/services/supabase/admin"
import type { WaitlistFormValues } from "@/features/landing/waitlist/schema"

export class WaitlistDuplicateEmailError extends Error {
  constructor() {
    super("Este e-mail já está cadastrado na lista.")
    this.name = "WaitlistDuplicateEmailError"
  }
}

/**
 * Único ponto de escrita na tabela `waitlist`. Qualquer rota ou server
 * action que precise gravar um cadastro deve chamar esta função — nunca
 * instanciar o client Supabase diretamente em outro lugar.
 */
export async function insertWaitlistEntry(values: WaitlistFormValues) {
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from("waitlist")
    .insert({
      name: values.name,
      email: values.email,
      phone: values.phone,
      city: values.city || null,
      state: values.state ? values.state.toUpperCase() : null,
      profile: values.profile ?? null,
      utm_source: values.utm_source ?? null,
      utm_medium: values.utm_medium ?? null,
      utm_campaign: values.utm_campaign ?? null,
      utm_content: values.utm_content ?? null,
      utm_term: values.utm_term ?? null,
      fbclid: values.fbclid ?? null,
      gclid: values.gclid ?? null,
    })
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
