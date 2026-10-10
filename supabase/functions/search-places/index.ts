// search-places — sugestões de endereço enquanto a pessoa digita.
//
// Qualquer usuário autenticado pode chamar. O app envia o texto e,
// opcionalmente, a posição do aparelho para priorizar resultados próximos.
import { adminClient, json, requireUser, serve } from "../_shared/http.ts"
import { MapsError, readCoords, searchPlaces } from "../_shared/maps.ts"

serve("search-places", async (request) => {
  await requireUser(request, adminClient())

  const body = await request.json().catch(() => null)
  const query = typeof body?.query === "string" ? body.query.trim() : ""
  if (query.length < 3 || query.length > 120) throw new MapsError("query_too_short")

  return json({ places: await searchPlaces(query, readCoords(body?.near)) })
})
