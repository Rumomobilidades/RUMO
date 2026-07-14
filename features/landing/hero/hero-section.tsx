import { Check } from "lucide-react"

import { Container } from "@/components/shared/container"
import { GradientText } from "@/components/shared/text-accents"
import { Reveal } from "@/components/shared/reveal"
import { Counter } from "@/components/shared/counter"
import { GridSpotlight } from "@/components/shared/grid-spotlight"
import { QuickEmailForm } from "@/features/landing/hero/quick-email-form"
import { PhoneMockup } from "@/features/landing/hero/phone-mockup"

const MICRO_TRUST = ["Grátis, sempre", "Leva menos de 1 minuto", "Sem compromisso"]

const KPIS = [
  { value: 3, suffix: "", label: "perfis com acesso prioritário" },
  { value: 100, suffix: "%", label: "gratuito, sempre será" },
  { value: 1, suffix: " min", label: "para garantir sua vaga" },
]

export function HeroSection() {
  return (
    <header
      id="hero"
      className="sec-dark relative overflow-hidden bg-background pt-[122px] pb-24 text-foreground sm:pt-[158px]"
    >
      <div
        className="pointer-events-none absolute -top-[200px] -right-[140px] size-[620px] rounded-full blur-[110px]"
        style={{
          background: "radial-gradient(circle, rgba(190,232,62,.14), transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-[240px] -left-[140px] size-[480px] rounded-full blur-[110px]"
        style={{
          background: "radial-gradient(circle, rgba(14,138,69,.16), transparent 65%)",
        }}
      />
      <GridSpotlight />

      <Container className="relative grid items-center gap-14 md:grid-cols-[1.08fr_0.92fr] md:gap-16">
        <div className="relative z-3">
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rumo-lime/20 bg-rumo-lime/10 px-4 py-1.5 text-[0.8rem] font-semibold text-rumo-lime-soft">
              <span className="animate-pulse-dot size-1.75 rounded-full bg-rumo-lime" />
              Acesso antecipado aberto · vagas limitadas por cidade
            </div>
          </Reveal>

          <Reveal delay={1}>
            <h1 className="mb-5 text-[clamp(2.18rem,5.8vw,4.2rem)] font-extrabold tracking-[-0.035em]">
              O futuro da mobilidade urbana está chegando.{" "}
              <GradientText>Entre antes de todo mundo.</GradientText>
            </h1>
          </Reveal>

          <Reveal delay={2}>
            <p className="mb-8 max-w-[500px] text-[clamp(1.02rem,1.5vw,1.18rem)] leading-[1.65] tracking-[-0.01em] text-muted-foreground">
              Preço fechado para quem viaja. Ganhos justos para quem dirige. Controle
              total para empresas. Garanta seu lugar na lista de fundadores e seja um
              dos primeiros a saber quando as vagas abrirem.
            </p>
          </Reveal>

          <Reveal delay={3}>
            <QuickEmailForm />
            <div className="mb-8 flex flex-wrap gap-4.5 text-[0.82rem] font-medium text-rumo-dim">
              {MICRO_TRUST.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="size-3.5 flex-none text-rumo-lime" strokeWidth={2.4} />
                  {item}
                </span>
              ))}
            </div>
            <div className="grid max-w-[520px] grid-cols-1 gap-2.5 min-[561px]:grid-cols-3">
              {KPIS.map((kpi) => (
                <div
                  key={kpi.label}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 backdrop-blur-md min-[561px]:block min-[561px]:justify-normal"
                >
                  <strong className="block text-[1.1rem] tracking-[-0.03em] text-[#F2F5F2]">
                    <Counter value={kpi.value} suffix={kpi.suffix} />
                  </strong>
                  <span className="block text-right text-[0.72rem] leading-[1.35] text-[#9AA69E] min-[561px]:text-left">
                    {kpi.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={2}>
          <PhoneMockup />
        </Reveal>
      </Container>
    </header>
  )
}
