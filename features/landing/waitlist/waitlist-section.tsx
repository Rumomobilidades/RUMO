import { Section } from "@/components/shared/section"
import { Kicker } from "@/components/shared/kicker"
import { Reveal } from "@/components/shared/reveal"
import { GradientText } from "@/components/shared/text-accents"
import { CheckList } from "@/components/shared/check-list"
import { WaitlistForm } from "@/features/landing/waitlist/waitlist-form"
import { WAITLIST_SECTION_ID } from "@/lib/constants"

const POINTS = [
  { strong: "Convite prioritário", rest: "por ordem de cadastro" },
  { strong: "Benefícios de fundador", rest: "que não se repetem depois" },
  { strong: "Sua cidade sobe na fila", rest: "a cada novo cadastro" },
  { strong: "Grátis, sem compromisso", rest: "e sem spam" },
]

export function WaitlistSection() {
  return (
    <Section id={WAITLIST_SECTION_ID} tone="dark" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute top-[-30%] right-[-10%] size-[700px] rounded-full blur-[50px]"
        style={{
          background: "radial-gradient(circle, rgba(190,232,62,.09), transparent 62%)",
        }}
      />

      <div className="relative grid gap-12 md:grid-cols-2 md:items-start">
        <Reveal>
          <Kicker>Última chamada da página</Kicker>
          <h2 className="mb-4.5 text-[clamp(1.8rem,3.6vw,2.6rem)] font-extrabold tracking-[-0.03em]">
            Os primeiros convites saem <GradientText>desta lista.</GradientText>
          </h2>
          <p className="mb-8 max-w-[460px] text-[clamp(1.02rem,1.5vw,1.18rem)] leading-[1.65] text-muted-foreground">
            Quando a RUMO abrir na sua cidade, vai existir dois grupos: quem entrou na
            frente e quem soube depois. Escolha o primeiro.
          </p>
          <CheckList items={POINTS} />
        </Reveal>

        <Reveal
          delay={1}
          className="sec-light relative overflow-hidden rounded-[22px] border border-border bg-card p-8.5 pt-9.5 text-card-foreground shadow-[0_8px_16px_rgba(0,0,0,.2),0_40px_90px_-30px_rgba(0,0,0,.5)] before:absolute before:inset-x-0 before:top-0 before:h-1.25 before:bg-gradient-to-r before:from-primary before:via-rumo-green-bright before:to-rumo-lime"
        >
          <WaitlistForm />
        </Reveal>
      </div>
    </Section>
  )
}
