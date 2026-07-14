import { NextResponse } from "next/server"

import {
  waitlistSchema,
  type WaitlistApiResponse,
} from "@/features/landing/waitlist/schema"
import {
  insertWaitlistEntry,
  WaitlistDuplicateEmailError,
} from "@/services/waitlist/waitlist.service"

export async function POST(request: Request): Promise<NextResponse<WaitlistApiResponse>> {
  const body = await request.json().catch(() => null)
  const parsed = waitlistSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "validation_error",
          message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
        },
      },
      { status: 400 }
    )
  }

  // Honeypot preenchido: finge sucesso para não sinalizar ao bot que foi bloqueado.
  if (parsed.data.website) {
    return NextResponse.json({ success: true, data: { id: "ok" } }, { status: 200 })
  }

  try {
    const entry = await insertWaitlistEntry(parsed.data)
    return NextResponse.json({ success: true, data: { id: entry.id } }, { status: 201 })
  } catch (error) {
    if (error instanceof WaitlistDuplicateEmailError) {
      return NextResponse.json(
        { success: false, error: { code: "duplicate_email", message: error.message } },
        { status: 409 }
      )
    }

    console.error("[api/waitlist] Falha ao gravar cadastro:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "internal_error",
          message: "Não foi possível registrar seu interesse agora. Tente novamente.",
        },
      },
      { status: 500 }
    )
  }
}
