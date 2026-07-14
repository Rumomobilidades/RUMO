import { Section } from "@/components/shared/section"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/shared/reveal"
import { Button } from "@/components/ui/button"
import { WAITLIST_SECTION_ID } from "@/lib/constants"

const STEPS = [
  {
    title: "Registre seu interesse",
    description:
      "Preencha o cadastro em menos de um minuto. Grátis e sem nenhum compromisso.",
  },
  {
    title: "Entre na base de interessados",
    description:
      "Seus dados ficam registrados para que possamos comunicar novidades e atualizações sobre a plataforma.",
  },
  {
    title: "Acompanhe o lançamento",
    description:
      "Conforme o projeto avançar, compartilharemos informações relevantes sobre a RUMO e seus próximos passos.",
  },
]

export function HowItWorksSection() {
  return (
    <Section id="como-funciona">
      <Reveal>
        <SectionHeading
          center
          kicker="Simples assim"
          title="Do cadastro às próximas novidades em 3 passos"
        />
      </Reveal>

      <div className="grid gap-4.5 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <Reveal
            key={step.title}
            delay={index as 0 | 1 | 2}
            className="border-border bg-muted/40 rounded-[18px] border p-8.5 pb-7.5"
          >
            <div
              className={`mb-5 grid size-9.5 place-items-center rounded-full text-[0.9rem] font-bold text-white ${
                index === STEPS.length - 1 ? "bg-primary" : "bg-foreground"
              }`}
            >
              {index + 1}
            </div>
            <h3 className="mb-2 text-[1.1rem] tracking-[-0.02em]">{step.title}</h3>
            <p className="text-muted-foreground text-[0.92rem]">{step.description}</p>
          </Reveal>
        ))}
      </div>

      <Reveal delay={3} className="mt-11 text-center">
        <Button asChild size="lg">
          <a href={`#${WAITLIST_SECTION_ID}`}>Registrar interesse →</a>
        </Button>
      </Reveal>
    </Section>
  )
}
