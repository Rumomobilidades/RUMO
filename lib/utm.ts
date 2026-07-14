const TRACKED_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
] as const

export type TrackedParam = (typeof TRACKED_PARAMS)[number]
export type TrackingParams = Partial<Record<TrackedParam, string>>

/** Lê utm_*, fbclid e gclid da query string atual. Só roda no client. */
export function readTrackingParamsFromLocation(): TrackingParams {
  if (typeof window === "undefined") return {}

  const params = new URLSearchParams(window.location.search)
  const result: TrackingParams = {}

  for (const key of TRACKED_PARAMS) {
    const value = params.get(key)
    if (value) result[key] = value
  }

  return result
}

export type PageContext = { landing?: string; referrer?: string }

/** Lê a página atual e a origem do visitante. Só roda no client. */
export function readPageContext(): PageContext {
  if (typeof window === "undefined") return {}

  return {
    landing: window.location.pathname,
    referrer: document.referrer || undefined,
  }
}
