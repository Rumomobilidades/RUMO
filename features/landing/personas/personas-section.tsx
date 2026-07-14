import { Section } from "@/components/shared/section"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/shared/reveal"
import { CheckList } from "@/components/shared/check-list"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { WAITLIST_SECTION_ID } from "@/lib/constants"

const PROFILES = [
  {
    tag: "Motoristas",
    title: '"Rodo o dia inteiro e sobra pouco."',
    subtitle: "Você merece ficar com mais do que produz.",
    points: [
      { strong: "Modelo mais justo", rest: "pensado para valorizar quem dirige" },
      { strong: "Valor líquido visível", rest: "antes de aceitar qualquer corrida" },
      { strong: "Saque rápido", rest: "sem burocracia e sem letras miúdas" },
    ],
    cta: "Quero dirigir com a RUMO",
    featured: true,
  },
  {
    tag: "Passageiros",
    title: '"Só quero chegar. Sem surpresa no preço."',
    subtitle: "O valor que você vê é o valor que você paga.",
    points: [
      { strong: "Preço fechado", rest: "confirmado antes de chamar" },
      { strong: "Motoristas verificados", rest: "e viagem compartilhável em tempo real" },
      { strong: "Experiência simples", rest: "do primeiro clique à chegada" },
    ],
    cta: "Quero usar a RUMO",
    featured: false,
  },
  {
    tag: "Empresas",
    title: '"Meu time se move e eu não enxergo nada."',
    subtitle: "Corridas corporativas com visibilidade total.",
    points: [
      { strong: "Painel único", rest: "de corridas, custos e equipes" },
      { strong: "Fatura única", rest: "— fim dos reembolsos manuais" },
      { strong: "Prioridade de acesso", rest: "corporativo desde o primeiro dia" },
    ],
    cta: "Quero para minha empresa",
    featured: false,
  },
]

export function PersonasSection() {
  return (
    <Section id="para-voce" tone="dark">
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
              "group flex flex-col rounded-[18px] border border-border bg-card p-8.5 pb-7.5 transition-transform duration-300 hover:-translate-y-1",
              profile.featured && "border-rumo-lime/35 bg-gradient-to-b from-rumo-lime/6 to-card"
            )}
          >
            <span className="mb-5 inline-flex w-fit items-center rounded-full border border-rumo-lime/20 bg-rumo-lime/10 px-3.5 py-1 text-[0.72rem] font-bold tracking-[0.05em] text-rumo-lime uppercase">
              {profile.tag}
            </span>
            <h3 className="mb-2.5 text-[1.35rem] leading-[1.25] tracking-[-0.025em]">
              {profile.title}
            </h3>
            <p className="mb-6 text-[0.93rem] text-muted-foreground">{profile.subtitle}</p>
            <CheckList items={profile.points} className="mb-7.5 flex-1 text-[0.91rem]" />
            <Button
              asChild
              variant={profile.featured ? "default" : "outline"}
              className={cn("w-full", profile.featured && "btn-shine")}
            >
              <a href={`#${WAITLIST_SECTION_ID}`}>{profile.cta} →</a>
            </Button>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
