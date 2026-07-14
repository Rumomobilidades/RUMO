import Link from "next/link"

import { Container } from "@/components/shared/container"

const FOOTER_NAV = [
  { href: "#produto", label: "Produto" },
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
    <footer className="sec-dark relative border-t border-border bg-background pt-14 pb-8 text-foreground">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rumo-lime/40 to-transparent" />
      <Container>
        <div className="mb-11 flex flex-wrap items-start justify-between gap-8">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2.5 text-[1.22rem] font-extrabold tracking-[-0.03em]"
            >
              <span className="grid size-8.5 place-items-center rounded-[10px] bg-rumo-lime text-[1.05rem] font-extrabold text-rumo-ink">
                R
              </span>
              RUMO
            </Link>
            <p className="mt-3.5 max-w-[300px] text-[0.88rem] text-muted-foreground">
              Um novo jeito de se mover pela cidade. Justo para quem dirige, previsível
              para quem viaja, transparente para quem gerencia.
            </p>
          </div>

          <div className="flex flex-wrap gap-9">
            <div>
              <h4 className="mb-4 text-[0.76rem] font-bold tracking-[0.06em] text-rumo-dim uppercase">
                Navegue
              </h4>
              <div className="flex flex-col gap-2.5">
                {FOOTER_NAV.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="w-fit text-[0.9rem] text-muted-foreground transition-colors hover:text-rumo-lime"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-[0.76rem] font-bold tracking-[0.06em] text-rumo-dim uppercase">
                Legal
              </h4>
              <div className="flex flex-col gap-2.5">
                {FOOTER_LEGAL.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="w-fit text-[0.9rem] text-muted-foreground transition-colors hover:text-rumo-lime"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-4 border-t border-border pt-6 text-[0.78rem] text-rumo-dim">
          <span>© {new Date().getFullYear()} RUMO Mobilidade Inteligente</span>
          <span>Feito para quem move a cidade</span>
        </div>
      </Container>
    </footer>
  )
}
