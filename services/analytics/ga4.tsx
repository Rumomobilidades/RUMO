import Script from "next/script"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackGa4Event(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag) return
  window.gtag("event", eventName, params)
}

export function GoogleAnalyticsScript({ measurementId }: { measurementId: string }) {
  return (
    <>
      <Script
        id="ga4-lib"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  )
}
