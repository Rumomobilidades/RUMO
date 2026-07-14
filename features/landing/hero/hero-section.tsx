import { Check } from "lucide-react"

import { Container } from "@/components/shared/container"
import { GradientText } from "@/components/shared/text-accents"
import { Reveal } from "@/components/shared/reveal"
import { QuickEmailForm } from "@/features/landing/hero/quick-email-form"
import { PhoneMockup } from "@/features/landing/hero/phone-mockup"

const MICRO_TRUST = ["Grátis", "Sem compromisso", "Atualizações sobre o lançamento"]

const KPIS = [
  { value: "3", label: "perfis considerados no desenvolvimento" },
  { value: "100%", label: "cadastro gratuito e sem compromisso" },
  { value: "1 min", label: "para registrar seu interesse" },
]

export function HeroSection() {
  return (
    <header
      id="hero"
      className="sec-dark bg-background text-foreground relative overflow-hidden pt-[122px] pb-24 sm:pt-[158px]"
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
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
          maskImage:
            "radial-gradient(ellipse 85% 65% at 50% 12%, #000 30%, transparent 75%)",
        }}
      />

      <Container className="relative grid items-center gap-14 md:grid-cols-[1.08fr_0.92fr] md:gap-16">
        <div className="relative z-[3]">
          <Reveal>
            <div className="border-rumo-lime/20 bg-rumo-lime/10 text-rumo-lime-soft mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[0.8rem] font-semibold">
              <span className="animate-pulse-dot bg-rumo-lime size-1.75 rounded-full" />
              Plataforma em desenvolvimento · Lista de interessados aberta
            </div>
          </Reveal>

          <Reveal delay={1}>
            <h1 className="mb-5 text-[clamp(2.18rem,5.8vw,4.2rem)] font-extrabold tracking-[-0.035em]">
              Um novo app de mobilidade está chegando.{" "}
              <GradientText>Acompanhe de perto essa construção.</GradientText>
            </h1>
          </Reveal>

          <Reveal delay={2}>
            <p className="text-muted-foreground mb-8 max-w-[500px] text-[clamp(1.02rem,1.5vw,1.18rem)] leading-[1.65] tracking-[-0.01em]">
              Preço fechado para quem viaja. Ganhos justos para quem dirige. Controle
              total para empresas. Cadastre seu interesse para receber novidades,
              atualizações e informações sobre o lançamento da RUMO.
            </p>
          </Reveal>

          <Reveal delay={3}>
            <QuickEmailForm />
            <div className="text-rumo-dim mb-8 flex flex-wrap gap-4.5 text-[0.82rem] font-medium">
              {MICRO_TRUST.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check
                    className="text-rumo-lime size-3.5 flex-none"
                    strokeWidth={2.4}
                  />
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
                    {kpi.value}
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
