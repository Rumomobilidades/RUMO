import "server-only"

import { createSupabaseAdminClient } from "@/services/supabase/admin"
import {
  insertWaitlistRow,
  WaitlistDuplicateEmailError,
} from "@/repositories/waitlist.repository"
import type { WaitlistFormValues } from "@/features/landing/waitlist/schema"

export { WaitlistDuplicateEmailError }

/** Metadados que só o servidor pode determinar — nunca aceitos do client. */
export type WaitlistServerContext = {
  ip: string | null
  userAgent: string | null
  device: string | null
  browser: string | null
  os: string | null
}

/**
 * Único ponto de orquestração de um cadastro na waitlist: sanitiza o que
 * vem do form, combina com o contexto capturado no servidor e delega a
 * gravação ao repository. Qualquer rota ou server action que precise criar
 * um cadastro deve chamar esta função — nunca instanciar o client Supabase
 * ou o repository diretamente em outro lugar.
 */
export async function insertWaitlistEntry(
  values: WaitlistFormValues,
  context: WaitlistServerContext
) {
  const supabase = createSupabaseAdminClient()

  return insertWaitlistRow(supabase, {
    name: values.name,
    email: values.email,
    phone: values.phone,
    city: values.city || null,
    state: values.state ? values.state.toUpperCase() : null,
    profile: values.profile ?? null,
    lgpd_consent: values.lgpd_consent,
    landing: values.landing ?? null,
    referrer: values.referrer ?? null,
    utm_source: values.utm_source ?? null,
    utm_medium: values.utm_medium ?? null,
    utm_campaign: values.utm_campaign ?? null,
    utm_content: values.utm_content ?? null,
    utm_term: values.utm_term ?? null,
    fbclid: values.fbclid ?? null,
    gclid: values.gclid ?? null,
    user_agent: context.userAgent,
    device: context.device,
    browser: context.browser,
    os: context.os,
    ip: context.ip,
  })
}
