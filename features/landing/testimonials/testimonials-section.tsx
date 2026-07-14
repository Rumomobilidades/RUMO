import { Quote } from "lucide-react"

import { Section } from "@/components/shared/section"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/shared/reveal"

const QUOTES = [
  {
    quote:
      "Preço fechado muda tudo. Eu só quero chamar a corrida sabendo exatamente quanto vai sair.",
    name: "Ana Martins",
    role: "Futura passageira",
    initials: "AM",
  },
  {
    quote:
      "Se eu vejo quanto vai sobrar antes de aceitar, consigo trabalhar com mais estratégia e menos tentativa.",
    name: "Carlos Rocha",
    role: "Motorista de aplicativo",
    initials: "CR",
  },
  {
    quote:
      "Para empresa, o valor está em sair do reembolso manual e enxergar as viagens em tempo real.",
    name: "Luiza Santos",
    role: "Operações corporativas",
    initials: "LS",
  },
]

export function TestimonialsSection() {
  return (
    <Section tone="muted">
      <Reveal>
        <SectionHeading
          center
          kicker="Ouvido de quem vive a mobilidade todo dia"
          title="A RUMO nasce das fricções reais de quem se move pela cidade."
        />
      </Reveal>

      <div className="grid gap-4.5 md:grid-cols-3">
        {QUOTES.map((item, index) => (
          <Reveal
            key={item.name}
            delay={index as 0 | 1 | 2}
            className="group relative rounded-[20px] border border-border bg-white p-6.5 shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.75 hover:shadow-md"
          >
            <Quote className="mb-3 size-5 text-primary/30" strokeWidth={2.5} />
            <p className="mb-5.5 text-[0.94rem] text-muted-foreground">
              &ldquo;{item.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="grid size-9.5 place-items-center rounded-full bg-accent text-[0.82rem] font-extrabold text-primary ring-2 ring-transparent transition-[box-shadow] group-hover:ring-primary/20">
                {item.initials}
              </div>
              <div>
                <b className="block text-[0.88rem]">{item.name}</b>
                <span className="block text-[0.76rem] text-rumo-dim">{item.role}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
