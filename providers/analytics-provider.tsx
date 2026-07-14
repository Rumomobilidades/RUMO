import {
  GoogleTagManagerScript,
  GoogleTagManagerNoScript,
} from "@/services/analytics/gtm"
import { GoogleAnalyticsScript } from "@/services/analytics/ga4"
import { MetaPixelScript } from "@/services/analytics/meta-pixel"
import { TikTokPixelScript } from "@/services/analytics/tiktok-pixel"
import { LinkedInInsightScript } from "@/services/analytics/linkedin-insight"

/**
 * Cada script só é injetado se a env var correspondente existir — sem conta
 * configurada, nenhum script "morto" é carregado em produção.
 */
export function AnalyticsProvider() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const tiktokPixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
  const linkedInPartnerId = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID

  return (
    <>
      {gtmId ? (
        <>
          <GoogleTagManagerScript containerId={gtmId} />
          <GoogleTagManagerNoScript containerId={gtmId} />
        </>
      ) : null}
      {ga4Id ? <GoogleAnalyticsScript measurementId={ga4Id} /> : null}
      {metaPixelId ? <MetaPixelScript pixelId={metaPixelId} /> : null}
      {tiktokPixelId ? <TikTokPixelScript pixelId={tiktokPixelId} /> : null}
      {linkedInPartnerId ? <LinkedInInsightScript partnerId={linkedInPartnerId} /> : null}
    </>
  )
}
