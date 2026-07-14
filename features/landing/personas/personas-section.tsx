import { Check } from "lucide-react"

import { Section } from "@/components/shared/section"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/shared/reveal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { WAITLIST_SECTION_ID } from "@/lib/constants"

const PROFILES = [
  {
    tag: "Motoristas",
    title: '"Rodo o dia inteiro e sobra pouco."',
    subtitle: "Você merece ficar com mais do que você produz.",
    points: [
      { strong: "Modelo mais justo", rest: "pensado para valorizar quem dirige" },
      { strong: "Veja o valor líquido", rest: "antes de aceitar qualquer corrida" },
      { strong: "Saque rápido", rest: ", sem burocracia e sem pegadinha" },
    ],
    cta: "Tenho interesse em dirigir",
    featured: true,
  },
  {
    tag: "Passageiros",
    title: '"Só quero chegar. Sem surpresa no preço."',
    subtitle: "O valor que você vê é o valor que você paga.",
    points: [
      { strong: "Preço fechado", rest: "confirmado antes de chamar" },
      { strong: "Motoristas verificados", rest: "e viagem compartilhável em tempo real" },
      {
        strong: "Experiência simples",
        rest: "para acompanhar o desenvolvimento da plataforma",
      },
    ],
    cta: "Tenho interesse em usar",
    featured: false,
  },
  {
    tag: "Empresas",
    title: '"Meu time se move e eu não enxergo nada."',
    subtitle: "Corridas corporativas com visibilidade total.",
    points: [
      { strong: "Painel único", rest: "de corridas, custos e equipes" },
      { strong: "Fatura única", rest: "— fim dos reembolsos manuais" },
      { strong: "Interesse corporativo", rest: "registrado para futuras atualizações" },
    ],
    cta: "Quero para minha empresa",
    featured: false,
  },
]

export function PersonasSection() {
  return (
    <Section id="para-voce" dark>
      <Reveal>
        <SectionHeading
          center
          kicker="Feita para o seu lado da rua"
          title="Em qual dessas frases você se reconhece?"
        />
      </Reveal>

      <div className="grid gap-4.5 md:grid-cols-3">
        {PROFILES.map((profile, index) => (
          <Reveal
            key={profile.tag}
            delay={index as 0 | 1 | 2}
            className={cn(
              "border-border bg-card flex flex-col rounded-[18px] border p-8.5 pb-7.5",
              profile.featured &&
                "border-rumo-lime/35 from-rumo-lime/6 to-card bg-gradient-to-b"
            )}
          >
            <span className="border-rumo-lime/20 bg-rumo-lime/10 text-rumo-lime mb-5 inline-flex w-fit items-center rounded-full border px-3.5 py-1 text-[0.72rem] font-bold tracking-[0.05em] uppercase">
              {profile.tag}
            </span>
            <h3 className="mb-2.5 text-[1.35rem] leading-[1.25] tracking-[-0.025em]">
              {profile.title}
            </h3>
            <p className="text-muted-foreground mb-6 text-[0.93rem]">
              {profile.subtitle}
            </p>
            <ul className="mb-7.5 flex flex-1 flex-col gap-3">
              {profile.points.map((point) => (
                <li
                  key={point.strong}
                  className="text-muted-foreground flex items-start gap-2.5 text-[0.91rem]"
                >
                  <Check
                    className="text-rumo-lime mt-1 size-4 flex-none"
                    strokeWidth={2.4}
                  />
                  <span>
                    <b className="text-foreground font-semibold">{point.strong}</b>{" "}
                    {point.rest}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              variant={profile.featured ? "default" : "outline"}
              className="w-full"
            >
              <a href={`#${WAITLIST_SECTION_ID}`}>{profile.cta} →</a>
            </Button>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
