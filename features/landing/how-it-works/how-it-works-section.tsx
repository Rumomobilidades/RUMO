import { Section } from "@/components/shared/section"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/shared/reveal"
import { Button } from "@/components/ui/button"
import { WAITLIST_SECTION_ID } from "@/lib/constants"

const STEPS = [
  {
    title: "Garanta seu lugar",
    description: "Preencha o cadastro em menos de um minuto. Grátis, sem compromisso.",
  },
  {
    title: "Entre para a lista de fundadores",
    description:
      "Seu lugar fica reservado por ordem de chegada — com os benefícios que só quem entra cedo carrega.",
  },
  {
    title: "Seja um dos primeiros a saber",
    description:
      "Assim que as vagas abrirem na sua cidade, você recebe o convite antes de todo mundo.",
  },
]

export function HowItWorksSection() {
  return (
    <Section id="como-funciona">
      <Reveal>
        <SectionHeading
          center
          kicker="Simples assim"
          title="Do cadastro ao convite, em 3 passos"
        />
      </Reveal>

      <div className="grid gap-4.5 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <Reveal
            key={step.title}
            delay={index as 0 | 1 | 2}
            className="rounded-[18px] border border-border bg-muted/40 p-8.5 pb-7.5 transition-transform duration-300 hover:-translate-y-1"
          >
            <div
              className={`mb-5 grid size-9.5 place-items-center rounded-full text-[0.9rem] font-bold text-white ${
                index === STEPS.length - 1 ? "bg-primary" : "bg-foreground"
              }`}
            >
              {index + 1}
            </div>
            <h3 className="mb-2 text-[1.1rem] tracking-[-0.02em]">{step.title}</h3>
            <p className="text-[0.92rem] text-muted-foreground">{step.description}</p>
          </Reveal>
        ))}
      </div>

      <Reveal delay={3} className="mt-11 text-center">
        <Button asChild size="lg" className="btn-shine">
          <a href={`#${WAITLIST_SECTION_ID}`}>Garantir minha vaga →</a>
        </Button>
      </Reveal>
    </Section>
  )
}
