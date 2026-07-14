import { Section } from "@/components/shared/section"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/shared/reveal"

const QUOTES = [
  {
    quote:
      "Preço fechado muda tudo. Eu só quero chamar a corrida sabendo exatamente quanto vai sair.",
    name: "Ana Martins",
    role: "Passageira frequente",
    initials: "AM",
  },
  {
    quote:
      "Se eu vejo quanto vai sobrar antes de aceitar, consigo trabalhar com mais estratégia e menos tentativa.",
    name: "Carlos Rocha",
    role: "Motorista parceiro",
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
    <Section>
      <Reveal>
        <SectionHeading
          center
          kicker="O que ouvimos no desenho do produto"
          title="A RUMO foi moldada a partir das fricções reais de quem se move todo dia."
        />
      </Reveal>

      <div className="grid gap-4.5 md:grid-cols-3">
        {QUOTES.map((item, index) => (
          <Reveal
            key={item.name}
            delay={index as 0 | 1 | 2}
            className="border-border rounded-[20px] border bg-white p-6.5 shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.75 hover:shadow-md"
          >
            <p className="text-muted-foreground mb-5.5 text-[0.94rem]">
              &ldquo;{item.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="bg-accent text-primary grid size-9.5 place-items-center rounded-full text-[0.82rem] font-extrabold">
                {item.initials}
              </div>
              <div>
                <b className="block text-[0.88rem]">{item.name}</b>
                <span className="text-rumo-dim block text-[0.76rem]">{item.role}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
