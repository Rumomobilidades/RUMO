export type ParsedUserAgent = {
  device: "mobile" | "tablet" | "desktop" | null
  browser: string | null
  os: string | null
}

/**
 * Parser leve baseado em regex — o suficiente para segmentar leads por
 * dispositivo/navegador/SO em relatórios de marketing. Não serve para
 * fingerprinting ou detecção precisa de bots; para isso, tratar no nível de
 * rate limiting/honeypot (ver lib/rate-limit.ts).
 */
export function parseUserAgent(userAgent: string | null): ParsedUserAgent {
  if (!userAgent) {
    return { device: null, browser: null, os: null }
  }

  const ua = userAgent.toLowerCase()

  const device: ParsedUserAgent["device"] = /ipad|tablet(?!.*mobile)/.test(ua)
    ? "tablet"
    : /mobi|iphone|ipod|android.*mobile/.test(ua)
      ? "mobile"
      : "desktop"

  const browser = /edg\//.test(ua)
    ? "Edge"
    : /opr\/|opera/.test(ua)
      ? "Opera"
      : /chrome|crios/.test(ua)
        ? "Chrome"
        : /firefox|fxios/.test(ua)
          ? "Firefox"
          : /safari/.test(ua)
            ? "Safari"
            : "Outro"

  const os = /windows/.test(ua)
    ? "Windows"
    : /iphone|ipad|ipod/.test(ua)
      ? "iOS"
      : /android/.test(ua)
        ? "Android"
        : /mac os/.test(ua)
          ? "macOS"
          : /linux/.test(ua)
            ? "Linux"
            : "Outro"

  return { device, browser, os }
}
