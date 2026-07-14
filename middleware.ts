import { NextResponse, type NextRequest } from "next/server"

/**
 * Hoje só normaliza headers de segurança. É o único arquivo que precisa de
 * edição (não recriação) quando o módulo de autenticação chegar — é aqui
 * que entra o refresh de sessão do Supabase e a proteção de rotas privadas
 * (/dashboard, /admin, etc.).
 */
export function middleware(_: NextRequest) {
  const response = NextResponse.next()

  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image).*)",
  ],
}
