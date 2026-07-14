import Script from "next/script"

declare global {
  interface Window {
    _linkedin_data_partner_ids?: string[]
    lintrk?: ((...args: unknown[]) => void) & { q?: unknown[] }
  }
}

export function trackLinkedInConversion(conversionId?: string) {
  if (typeof window === "undefined" || !window.lintrk) return
  window.lintrk("track", conversionId ? { conversion_id: conversionId } : undefined)
}

export function LinkedInInsightScript({ partnerId }: { partnerId: string }) {
  return (
    <>
      <Script id="linkedin-insight" strategy="afterInteractive">
        {`
          _linkedin_partner_id = "${partnerId}";
          window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
          window._linkedin_data_partner_ids.push(_linkedin_partner_id);
          (function(l) {
            if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
            window.lintrk.q=[]}
            var s = document.getElementsByTagName("script")[0];
            var b = document.createElement("script");
            b.type = "text/javascript";b.async = true;
            b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
            s.parentNode.insertBefore(b, s);
          })(window.lintrk);
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://px.ads.linkedin.com/collect/?pid=${partnerId}&fmt=gif`}
        />
      </noscript>
    </>
  )
}
