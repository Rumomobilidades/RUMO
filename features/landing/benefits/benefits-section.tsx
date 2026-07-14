import { Crown, Rocket, Timer } from "lucide-react"

import { Section } from "@/components/shared/section"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/shared/reveal"
import { Highlight } from "@/components/shared/text-accents"

const GAINS = [
  {
    icon: Timer,
    title: "Acesso prioritário garantido",
    description:
      "Os convites saem por ordem de cadastro. Quem entra agora recebe o seu antes de todo mundo.",
  },
  {
    icon: Crown,
    title: "Benefícios de fundador",
    description:
      "Quem chega primeiro carrega esse status — com vantagens que não existem mais depois do lançamento.",
  },
  {
    icon: Rocket,
    title: "Sua cidade entra mais rápido no mapa",
    description:
      "Cada cadastro conta como voto de demanda. Cidades com mais interesse sobem na fila de expansão.",
  },
]

export function BenefitsSection() {
  return (
    <Section id="vantagens">
      <Reveal>
        <SectionHeading
          kicker="O que você ganha ao entrar agora"
          title={
            <>
              Entrar cedo não é só curiosidade. É{" "}
              <Highlight>vantagem real.</Highlight>
            </>
          }
        />
      </Reveal>

      <div className="grid gap-4.5 md:grid-cols-3">
        {GAINS.map((gain, index) => (
          <Reveal
            key={gain.title}
            delay={index as 0 | 1 | 2}
            className="group relative overflow-hidden rounded-[18px] border border-border bg-white p-8.5 pb-7.5 shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.75 hover:shadow-md"
          >
            <span className="absolute right-5.5 bottom-0 left-5.5 h-[3px] origin-left scale-x-35 rounded-t-[3px] bg-gradient-to-r from-primary to-rumo-lime transition-transform group-hover:scale-x-100" />
            <div className="mb-5.5 grid size-11.5 place-items-center rounded-[13px] bg-accent transition-transform duration-300 group-hover:scale-110">
              <gain.icon className="size-5.25 text-primary" />
            </div>
            <h3 className="mb-2 text-[1.15rem] tracking-[-0.02em]">{gain.title}</h3>
            <p className="text-[0.93rem] text-muted-foreground">{gain.description}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
