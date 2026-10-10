// estimate-ride — transforma dois endereços em uma cotação de corrida.
//
// O passageiro autenticado envia origem e destino em texto. A função localiza
// os dois pontos, calcula a rota de carro e grava a cotação pelo RPC
// create_ride_quote (só executável com service role), que aplica a tarifa.
// Distância, duração e preço nunca vêm do app.
//
// PROVEDOR DE MAPAS — PROVISÓRIO: sem chave do Google, usa serviços públicos
// baseados no OpenStreetMap (Photon para endereço, OSRM para rota). São dados
// reais, mas esses servidores são de demonstração: sem garantia de
// disponibilidade e com limite de uso. Servem para o teste controlado, não
// para lançamento. Para trocar pelo Google, basta reimplementar `geocode` e
// `route` abaixo. (O Nominatim foi descartado: devolve 403 para chamadas
// vindas do servidor do Supabase.)
import { createClient } from "npm:@supabase/supabase-js@2"

const USER_AGENT = "RUMO-dev/0.1 (https://www.vaiderumo.com.br)"
const MAX_ADDRESS_LENGTH = 200
const MAX_DISTANCE_M = 300_000

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

type Place = { address: string; lat: number; lng: number }

class EstimateError extends Error {
  constructor(public code: string, public status = 400, public detail?: string) {
    super(code)
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}

// Caixa que cobre o Brasil: oeste, sul, leste, norte.
const BRAZIL_BBOX = "-74,-34,-34,5.3"

type PhotonFeature = {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    street?: string
    housenumber?: string
    district?: string
    city?: string
    state?: string
    countrycode?: string
  }
}

function formatAddress(p: PhotonFeature["properties"]) {
  const street = p.street ?? p.name
  const line = [street, p.housenumber].filter(Boolean).join(", ")
  const parts = [line, p.district, p.city, p.state].filter(Boolean)
  return [...new Set(parts)].join(" - ")
}

async function geocode(query: string, which: "origin" | "destination"): Promise<Place> {
  const url = new URL("https://photon.komoot.io/api/")
  url.searchParams.set("q", query)
  url.searchParams.set("limit", "1")
  url.searchParams.set("bbox", BRAZIL_BBOX)

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)

  if (!response?.ok) {
    throw new EstimateError("maps_unavailable", 502, `geocode:${response?.status ?? "sem resposta"}`)
  }

  const data = (await response.json()) as { features?: PhotonFeature[] }
  const first = data.features?.[0]
  if (!first || first.properties.countrycode !== "BR") {
    throw new EstimateError(`${which}_not_found`, 422)
  }

  const [lng, lat] = first.geometry.coordinates
  return { address: formatAddress(first.properties) || query, lat, lng }
}

async function route(from: Place, to: Place): Promise<{ distanceM: number; durationS: number }> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`,
    { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(10_000) },
  ).catch(() => null)

  if (!response?.ok) {
    throw new EstimateError("maps_unavailable", 502, `route:${response?.status ?? "sem resposta"}`)
  }

  const data = (await response.json()) as {
    code: string
    routes?: { distance: number; duration: number }[]
  }
  const best = data.routes?.[0]
  if (data.code !== "Ok" || !best) throw new EstimateError("route_not_found", 422)

  return { distanceM: Math.round(best.distance), durationS: Math.round(best.duration) }
}

function readAddress(value: unknown, which: "origin" | "destination") {
  if (typeof value !== "string") throw new EstimateError(`${which}_required`)
  const text = value.trim()
  if (text.length < 5 || text.length > MAX_ADDRESS_LENGTH) throw new EstimateError(`${which}_required`)
  return text
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405)

  try {
    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "")
    if (!token) throw new EstimateError("not_authenticated", 401)

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )

    const { data: auth, error: authError } = await admin.auth.getUser(token)
    if (authError || !auth.user) throw new EstimateError("not_authenticated", 401)

    const body = await request.json().catch(() => null)
    const originText = readAddress(body?.origin, "origin")
    const destinationText = readAddress(body?.destination, "destination")

    // Em sequência, para não pressionar o servidor público de endereços.
    const origin = await geocode(originText, "origin")
    const destination = await geocode(destinationText, "destination")
    const { distanceM, durationS } = await route(origin, destination)

    if (distanceM < 100) throw new EstimateError("route_too_short", 422)
    if (distanceM > MAX_DISTANCE_M) throw new EstimateError("route_too_long", 422)

    const { data: quote, error } = await admin.rpc("create_ride_quote", {
      p_passenger_id: auth.user.id,
      p_origin_address: origin.address,
      p_origin_lat: origin.lat,
      p_origin_lng: origin.lng,
      p_destination_address: destination.address,
      p_destination_lat: destination.lat,
      p_destination_lng: destination.lng,
      p_distance_m: distanceM,
      p_duration_s: durationS,
    })

    if (error) {
      if (error.message === "not_a_passenger") throw new EstimateError("not_a_passenger", 403)
      console.error("[estimate-ride] create_ride_quote falhou:", error.message)
      throw new EstimateError("internal_error", 500)
    }

    return json({ quote })
  } catch (error) {
    if (error instanceof EstimateError) {
      if (error.detail) console.error(`[estimate-ride] ${error.code} (${error.detail})`)
      return json({ error: error.code, detail: error.detail }, error.status)
    }
    console.error("[estimate-ride] erro inesperado:", error)
    return json({ error: "internal_error" }, 500)
  }
})
