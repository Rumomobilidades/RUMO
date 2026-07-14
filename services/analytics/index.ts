import { pushToDataLayer } from "@/services/analytics/gtm"
import { trackGa4Event } from "@/services/analytics/ga4"
import { trackMetaPixelEvent } from "@/services/analytics/meta-pixel"
import { trackTikTokEvent } from "@/services/analytics/tiktok-pixel"
import { trackLinkedInConversion } from "@/services/analytics/linkedin-insight"

export {
  pushToDataLayer,
  trackGa4Event,
  trackMetaPixelEvent,
  trackTikTokEvent,
  trackLinkedInConversion,
}

/** Dispara o mesmo evento em todas as plataformas configuradas de uma vez. */
export function trackLeadEvent(payload?: Record<string, unknown>) {
  pushToDataLayer({ event: "generate_lead", ...payload })
  trackGa4Event("generate_lead", payload)
  trackMetaPixelEvent("Lead", payload)
  trackTikTokEvent("SubmitForm", payload)
  trackLinkedInConversion()
}
