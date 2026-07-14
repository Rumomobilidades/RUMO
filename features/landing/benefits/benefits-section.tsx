import { Compass, Radar, Sparkles } from "lucide-react"

import { Section } from "@/components/shared/section"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/shared/reveal"
import { Highlight } from "@/components/shared/text-accents"

const GAINS = [
  {
    icon: Sparkles,
    title: "Você acompanha o projeto de perto",
    description:
      "Seu cadastro nos ajuda a comunicar novidades, atualizações e informações relevantes conforme a plataforma avança.",
  },
  {
    icon: Compass,
    title: "Seu interesse orienta prioridades",
    description:
      "A base de interessados ajuda a RUMO a entender quais públicos, necessidades e regiões devem receber mais atenção no lançamento.",
  },
  {
    icon: Radar,
    title: "Você sinaliza demanda real",
    description:
      "Os cadastros indicam onde existe maior interesse pela solução e ajudam a planejar os próximos passos da operação.",
  },
]

export function BenefitsSection() {
  return (
    <Section id="vantagens">
      <Reveal>
        <SectionHeading
          kicker="Por que se cadastrar"
          title={
            <>
              Entrar na lista é mostrar interesse e{" "}
              <Highlight>acompanhar a evolução.</Highlight>
            </>
          }
        />
      </Reveal>

      <div className="grid gap-4.5 md:grid-cols-3">
        {GAINS.map((gain, index) => (
          <Reveal
            key={gain.title}
            delay={index as 0 | 1 | 2}
            className="group border-border relative overflow-hidden rounded-[18px] border bg-white p-8.5 pb-7.5 shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.75 hover:shadow-md"
          >
            <span className="from-primary to-rumo-lime absolute right-5.5 bottom-0 left-5.5 h-[3px] origin-left scale-x-35 rounded-t-[3px] bg-gradient-to-r transition-transform group-hover:scale-x-100" />
            <div className="bg-accent mb-5.5 grid size-11.5 place-items-center rounded-[13px]">
              <gain.icon className="text-primary size-5.25" />
            </div>
            <h3 className="mb-2 text-[1.15rem] tracking-[-0.02em]">{gain.title}</h3>
            <p className="text-muted-foreground text-[0.93rem]">{gain.description}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
