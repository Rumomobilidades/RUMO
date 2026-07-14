export const SITE = {
  name: "RUMO",
  title: "RUMO — Acompanhe o lançamento",
  description:
    "Um novo app de mobilidade está em desenvolvimento. Entre na lista de interessados para acompanhar novidades, atualizações e informações sobre o lançamento da RUMO.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "pt_BR",
} as const

export const NAV_LINKS = [
  { href: "#vantagens", label: "Vantagens" },
  { href: "#produto", label: "Produto" },
  { href: "#para-voce", label: "Para você" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#faq", label: "Dúvidas" },
] as const

export const WAITLIST_SECTION_ID = "lista"
export const WAITLIST_EMAIL_STORAGE_KEY = "rumo:waitlist:prefill-email"
