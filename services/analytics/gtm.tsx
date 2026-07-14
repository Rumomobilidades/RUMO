import Script from "next/script"

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

export function pushToDataLayer(data: Record<string, unknown>) {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(data)
}

export function GoogleTagManagerScript({ containerId }: { containerId: string }) {
  return (
    <Script id="gtm-script" strategy="afterInteractive">
      {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
        var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
        j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${containerId}');
      `}
    </Script>
  )
}

export function GoogleTagManagerNoScript({ containerId }: { containerId: string }) {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="gtm"
      />
    </noscript>
  )
}
