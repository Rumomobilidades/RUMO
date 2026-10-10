// Acesso ao provedor de mapas, compartilhado pelas Edge Functions.
//
// PROVEDOR PROVISÓRIO: sem chave do Google, usa serviços públicos baseados no
// OpenStreetMap — Photon (endereços e sugestões) e OSRM (rota). São dados
// reais, mas de servidores de demonstração: sem garantia de disponibilidade,
// sem trânsito e com precisão de número de casa limitada. Servem para o teste
// controlado, não para lançamento. Para trocar pelo Google, reimplemente as
// quatro funções exportadas aqui; o resto do sistema não muda.
// (O Nominatim foi descartado: devolve 403 para o servidor do Supabase.)

const USER_AGENT = "RUMO-dev/0.1 (https://www.vaiderumo.com.br)"
/** Caixa que cobre o Brasil: oeste, sul, leste, norte. */
const BRAZIL_BBOX = "-74,-34,-34,5.3"

export type Place = { address: string; lat: number; lng: number }
export type Suggestion = { id: string; title: string; subtitle: string; lat: number; lng: number }

export class MapsError extends Error {
  constructor(public code: string, public status = 400, public detail?: string) {
    super(code)
  }
}

type PhotonFeature = {
  geometry: { coordinates: [number, number] }
  properties: {
    osm_id?: number
    osm_type?: string
    name?: string
    street?: string
    housenumber?: string
    district?: string
    city?: string
    state?: string
    countrycode?: string
  }
}

async function photon(path: string, params: Record<string, string>, step: string) {
  const url = new URL(`https://photon.komoot.io/${path}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)

  if (!response?.ok) {
    throw new MapsError("maps_unavailable", 502, `${step}:${response?.status ?? "sem resposta"}`)
  }

  const data = (await response.json()) as { features?: PhotonFeature[] }
  return (data.features ?? []).filter((feature) => feature.properties.countrycode === "BR")
}

function titleOf(p: PhotonFeature["properties"]) {
  const street = p.street ?? p.name ?? ""
  // Lugar com nome próprio (praça, loja, terminal) vem em `name`, com a rua em `street`.
  if (p.name && p.street && p.name !== p.street) return p.name
  return [street, p.housenumber].filter(Boolean).join(", ")
}

function subtitleOf(p: PhotonFeature["properties"]) {
  const withStreet = p.name && p.street && p.name !== p.street
  const streetLine = withStreet ? [p.street, p.housenumber].filter(Boolean).join(", ") : null
  return [...new Set([streetLine, p.district, p.city, p.state].filter(Boolean))].join(" - ")
}

function formatAddress(p: PhotonFeature["properties"]) {
  return [titleOf(p), subtitleOf(p)].filter(Boolean).join(" - ")
}

/** Endereço digitado -> ponto. */
export async function geocode(query: string, which: "origin" | "destination"): Promise<Place> {
  const [first] = await photon("api/", { q: query, limit: "1", bbox: BRAZIL_BBOX }, "geocode")
  if (!first) throw new MapsError(`${which}_not_found`, 422)

  const [lng, lat] = first.geometry.coordinates
  return { address: formatAddress(first.properties) || query, lat, lng }
}

/** Ponto do GPS -> endereço mais próximo, para exibir. As coordenadas do aparelho são mantidas. */
export async function reverseGeocode(lat: number, lng: number): Promise<Place> {
  const [first] = await photon("reverse", { lat: String(lat), lon: String(lng) }, "reverse")
  return { address: (first && formatAddress(first.properties)) || "Localização atual", lat, lng }
}

/** Sugestões enquanto a pessoa digita, priorizando o que está perto dela. */
export async function searchPlaces(
  query: string,
  near: { lat: number; lng: number } | null,
): Promise<Suggestion[]> {
  const params: Record<string, string> = { q: query, limit: "8", bbox: BRAZIL_BBOX }
  if (near) {
    params.lat = String(near.lat)
    params.lon = String(near.lng)
  }

  const features = await photon("api/", params, "search")
  const seen = new Set<string>()
  const suggestions: Suggestion[] = []

  for (const feature of features) {
    const title = titleOf(feature.properties)
    const subtitle = subtitleOf(feature.properties)
    const key = `${title}|${subtitle}`
    if (!title || seen.has(key)) continue
    seen.add(key)

    const [lng, lat] = feature.geometry.coordinates
    suggestions.push({
      id: `${feature.properties.osm_type ?? "x"}${feature.properties.osm_id ?? key}`,
      title,
      subtitle,
      lat,
      lng,
    })
    if (suggestions.length === 6) break
  }

  return suggestions
}

/** Rota de carro entre dois pontos. */
export async function route(from: Place, to: Place): Promise<{ distanceM: number; durationS: number }> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`,
    { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(10_000) },
  ).catch(() => null)

  if (!response?.ok) {
    throw new MapsError("maps_unavailable", 502, `route:${response?.status ?? "sem resposta"}`)
  }

  const data = (await response.json()) as {
    code: string
    routes?: { distance: number; duration: number }[]
  }
  const best = data.routes?.[0]
  if (data.code !== "Ok" || !best) throw new MapsError("route_not_found", 422)

  return { distanceM: Math.round(best.distance), durationS: Math.round(best.duration) }
}

export function readCoords(value: unknown): { lat: number; lng: number } | null {
  if (!value || typeof value !== "object") return null
  const { lat, lng } = value as { lat?: unknown; lng?: unknown }
  if (typeof lat !== "number" || typeof lng !== "number") return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}
