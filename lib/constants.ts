export const SITE = {
  name: "RUMO",
  title: "RUMO — Garanta seu acesso antecipado",
  description:
    "A RUMO está prestes a mudar a forma como você se move pela cidade. Entre na lista de fundadores e seja um dos primeiros a saber quando as vagas abrirem.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "pt_BR",
} as const

export const NAV_LINKS = [
  { href: "#produto", label: "Produto" },
  { href: "#vantagens", label: "Vantagens" },
  { href: "#para-voce", label: "Para você" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#faq", label: "Dúvidas" },
] as const

export const WAITLIST_SECTION_ID = "lista"
export const WAITLIST_EMAIL_STORAGE_KEY = "rumo:waitlist:prefill-email"
