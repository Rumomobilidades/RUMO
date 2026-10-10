// estimate-ride — transforma origem e destino em cotações de corrida.
//
// O passageiro autenticado envia os dois pontos, cada um como:
//   - { lat, lng, label }  lugar escolhido na lista de sugestões;
//   - { lat, lng }         posição do aparelho (o endereço é descoberto aqui);
//   - "texto"              endereço digitado (localizado aqui).
// A função calcula a rota de carro e grava UMA COTAÇÃO POR CATEGORIA ATIVA
// pelo RPC create_ride_quote (só executável com service role), que aplica a
// tarifa. Distância, duração e preço nunca vêm do app.
import { adminClient, json, requireUser, serve } from "../_shared/http.ts"
import { geocode, MapsError, readCoords, reverseGeocode, route, type Place } from "../_shared/maps.ts"

const MAX_ADDRESS_LENGTH = 200
const MAX_DISTANCE_M = 300_000

async function readPlace(value: unknown, which: "origin" | "destination"): Promise<Place> {
  const coords = readCoords(value)

  if (coords) {
    const label = (value as { label?: unknown }).label
    if (typeof label === "string" && label.trim().length >= 3) {
      return { address: label.trim().slice(0, MAX_ADDRESS_LENGTH), ...coords }
    }
    return reverseGeocode(coords.lat, coords.lng)
  }

  if (typeof value !== "string") throw new MapsError(`${which}_required`)
  const text = value.trim()
  if (text.length < 5 || text.length > MAX_ADDRESS_LENGTH) throw new MapsError(`${which}_required`)
  return geocode(text, which)
}

serve("estimate-ride", async (request) => {
  const admin = adminClient()
  const user = await requireUser(request, admin)
  const body = await request.json().catch(() => null)

  // Em sequência, para não pressionar o servidor público de endereços.
  const origin = await readPlace(body?.origin, "origin")
  const destination = await readPlace(body?.destination, "destination")
  const { distanceM, durationS } = await route(origin, destination)

  if (distanceM < 100) throw new MapsError("route_too_short", 422)
  if (distanceM > MAX_DISTANCE_M) throw new MapsError("route_too_long", 422)

  const { data: categories, error: categoriesError } = await admin
    .from("ride_categories")
    .select("id, name, description, seats")
    .eq("is_active", true)
    .order("sort_order")

  if (categoriesError) {
    console.error("[estimate-ride] categorias:", categoriesError.message)
    throw new MapsError("internal_error", 500)
  }
  if (!categories?.length) throw new MapsError("no_categories", 503)

  const quotes = []
  for (const category of categories) {
    const { data: quote, error } = await admin.rpc("create_ride_quote", {
      p_passenger_id: user.id,
      p_origin_address: origin.address,
      p_origin_lat: origin.lat,
      p_origin_lng: origin.lng,
      p_destination_address: destination.address,
      p_destination_lat: destination.lat,
      p_destination_lng: destination.lng,
      p_distance_m: distanceM,
      p_duration_s: durationS,
      p_category_id: category.id,
    })

    if (error) {
      if (error.message === "not_a_passenger") throw new MapsError("not_a_passenger", 403)
      console.error("[estimate-ride] create_ride_quote falhou:", error.message)
      throw new MapsError("internal_error", 500)
    }

    quotes.push({ ...quote, category })
  }

  // `quote` (a primeira) é mantido para clientes antigos.
  return json({ quotes, quote: quotes[0] })
})
