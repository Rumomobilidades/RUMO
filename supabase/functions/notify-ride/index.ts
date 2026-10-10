// notify-ride — envia as notificações push de um evento de corrida.
//
// Chamada SÓ pelo banco: o gatilho `rides_notify` dispara a cada corrida
// criada e a cada mudança de status, com um segredo no cabeçalho. Assim o
// aviso sai de um evento real e autorizado, mesmo com os apps fechados.
//
// Entrega pelo serviço de push do Expo, que repassa para APNs (iPhone) e FCM
// (Android). Cada tentativa fica registrada em `notification_log`.
import { adminClient, json } from "../_shared/http.ts"

type Ride = {
  id: string
  passenger_id: string
  driver_id: string | null
  status: string
  origin_address: string
  destination_address: string
  estimated_price_cents: number
  cancelled_by: string | null
}

type Message = { title: string; body: string }

const short = (address: string) => address.split(" - ")[0] ?? address
const price = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`

/** Quem avisar e o que dizer, para cada evento. */
async function plan(
  admin: ReturnType<typeof adminClient>,
  ride: Ride,
  event: string,
): Promise<{ userIds: string[]; message: Message } | null> {
  const firstName = async (id: string | null) => {
    if (!id) return null
    const { data } = await admin.from("profiles").select("full_name").eq("id", id).maybeSingle()
    return data?.full_name?.trim().split(/\s+/)[0] ?? null
  }

  switch (event) {
    case "requested": {
      // Motoristas aprovados e online, sem corrida em andamento e que não recusaram esta.
      const [{ data: drivers }, { data: busy }, { data: declined }] = await Promise.all([
        admin.from("drivers").select("id").eq("approval_status", "approved").eq("is_online", true),
        admin.from("rides").select("driver_id").in("status", ["accepted", "arrived", "in_progress"]),
        admin.from("ride_declines").select("driver_id").eq("ride_id", ride.id),
      ])
      const excluded = new Set([
        ride.passenger_id,
        ...(busy ?? []).map((row) => row.driver_id),
        ...(declined ?? []).map((row) => row.driver_id),
      ])
      return {
        userIds: (drivers ?? []).map((row) => row.id).filter((id) => !excluded.has(id)),
        message: {
          title: `Nova corrida · ${price(ride.estimated_price_cents)}`,
          body: `${short(ride.origin_address)} → ${short(ride.destination_address)}`,
        },
      }
    }
    case "accepted": {
      const driver = await firstName(ride.driver_id)
      return {
        userIds: [ride.passenger_id],
        message: {
          title: "Motorista a caminho",
          body: driver ? `${driver} aceitou sua corrida.` : "Um motorista aceitou sua corrida.",
        },
      }
    }
    case "arrived":
      return {
        userIds: [ride.passenger_id],
        message: { title: "Seu motorista chegou", body: `Encontre-o em ${short(ride.origin_address)}.` },
      }
    case "in_progress":
      return {
        userIds: [ride.passenger_id],
        message: { title: "Viagem iniciada", body: `A caminho de ${short(ride.destination_address)}.` },
      }
    case "completed":
      return {
        userIds: [ride.passenger_id],
        message: { title: "Você chegou", body: `Viagem concluída · ${price(ride.estimated_price_cents)}` },
      }
    case "cancelled": {
      // Avisa a outra parte; se ainda não havia motorista, não há quem avisar.
      const other = ride.cancelled_by === ride.passenger_id ? ride.driver_id : ride.passenger_id
      if (!other) return null
      return {
        userIds: [other],
        message: {
          title: "Corrida cancelada",
          body:
            ride.cancelled_by === ride.passenger_id
              ? "O passageiro cancelou a corrida."
              : "O motorista cancelou a corrida.",
        },
      }
    }
    default:
      return null
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405)

  const secret = Deno.env.get("NOTIFY_SECRET")
  if (!secret || request.headers.get("x-rumo-secret") !== secret) {
    return json({ error: "forbidden" }, 403)
  }

  const admin = adminClient()
  const body = await request.json().catch(() => null)
  const rideId = typeof body?.ride_id === "string" ? body.ride_id : null
  const event = typeof body?.event === "string" ? body.event : null
  if (!rideId || !event) return json({ error: "invalid_body" }, 400)

  const { data: ride } = await admin
    .from("rides")
    .select(
      "id, passenger_id, driver_id, status, origin_address, destination_address, estimated_price_cents, cancelled_by",
    )
    .eq("id", rideId)
    .maybeSingle()
  if (!ride) return json({ error: "ride_not_found" }, 404)

  const target = await plan(admin, ride as Ride, event)
  const log = { ride_id: rideId, event, recipients: 0, tokens: 0, delivered: 0, errors: null as unknown }

  if (target && target.userIds.length > 0) {
    log.recipients = target.userIds.length
    const { data: rows } = await admin.from("push_tokens").select("token").in("user_id", target.userIds)
    const tokens = (rows ?? []).map((row) => row.token)
    log.tokens = tokens.length

    if (tokens.length > 0) {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(
          tokens.map((to) => ({
            to,
            title: target.message.title,
            body: target.message.body,
            sound: "default",
            priority: "high",
            channelId: "corridas",
            data: { ride_id: rideId, event },
          })),
        ),
        signal: AbortSignal.timeout(10_000),
      }).catch((error) => ({ ok: false, status: 0, json: async () => ({ errors: [String(error)] }) }))

      const result = (await response.json().catch(() => null)) as {
        data?: { status: string; message?: string; details?: { error?: string } }[]
        errors?: unknown
      } | null

      const tickets = result?.data ?? []
      const failed: { token: string; error: string }[] = []
      const dead: string[] = []

      tickets.forEach((ticket, index) => {
        if (ticket.status === "ok") {
          log.delivered++
          return
        }
        const error = ticket.details?.error ?? ticket.message ?? "erro"
        failed.push({ token: tokens[index].slice(0, 22) + "…", error })
        // Aparelho desinstalou o app ou o token expirou: não tentar de novo.
        if (ticket.details?.error === "DeviceNotRegistered") dead.push(tokens[index])
      })

      if (dead.length > 0) await admin.from("push_tokens").delete().in("token", dead)
      if (failed.length > 0 || result?.errors) log.errors = { failed, service: result?.errors ?? null }
    }
  }

  await admin.from("notification_log").insert(log)
  return json(log)
})
