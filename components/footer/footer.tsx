import Link from "next/link"

import { Container } from "@/components/shared/container"

const FOOTER_NAV = [
  { href: "#vantagens", label: "Vantagens" },
  { href: "#para-voce", label: "Para você" },
  { href: "#faq", label: "Dúvidas" },
]

const FOOTER_LEGAL = [
  { href: "#", label: "Privacidade" },
  { href: "#", label: "Termos de uso" },
]

export function Footer() {
  return (
    <footer className="border-border bg-background border-t pt-14 pb-8">
      <Container>
        <div className="mb-11 flex flex-wrap items-start justify-between gap-8">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2.5 text-[1.22rem] font-extrabold tracking-[-0.03em]"
            >
              <span className="bg-primary text-primary-foreground grid size-8.5 place-items-center rounded-[10px] text-[1.05rem] font-extrabold">
                R
              </span>
              RUMO
            </Link>
            <p className="text-muted-foreground mt-3.5 max-w-[300px] text-[0.88rem]">
              Um novo jeito de se mover pela cidade. Justo para quem dirige, previsível
              para quem viaja, transparente para quem gerencia.
            </p>
          </div>

          <div className="flex flex-wrap gap-9">
            <div>
              <h4 className="text-rumo-dim mb-4 text-[0.76rem] font-bold tracking-[0.06em] uppercase">
                Navegue
              </h4>
              <div className="flex flex-col gap-2.5">
                {FOOTER_NAV.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-muted-foreground hover:text-primary text-[0.9rem] transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-rumo-dim mb-4 text-[0.76rem] font-bold tracking-[0.06em] uppercase">
                Legal
              </h4>
              <div className="flex flex-col gap-2.5">
                {FOOTER_LEGAL.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-muted-foreground hover:text-primary text-[0.9rem] transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-border text-rumo-dim flex flex-wrap justify-between gap-4 border-t pt-6 text-[0.78rem]">
          <span>© {new Date().getFullYear()} RUMO Mobilidade Inteligente</span>
          <span>Feito para quem move a cidade</span>
        </div>
      </Container>
    </footer>
  )
}
