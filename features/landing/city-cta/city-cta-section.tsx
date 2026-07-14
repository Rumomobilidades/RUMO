import { Section } from "@/components/shared/section"
import { Kicker } from "@/components/shared/kicker"
import { Reveal } from "@/components/shared/reveal"
import { Highlight } from "@/components/shared/text-accents"
import { Button } from "@/components/ui/button"
import { WAITLIST_SECTION_ID } from "@/lib/constants"

const CITIES = [
  "Itajaí",
  "Balneário Camboriú",
  "Brusque",
  "Itapema",
  "Navegantes",
  "Blumenau",
  "Florianópolis",
  "Joinville",
]

const SIGNAL_BAR_HEIGHTS = ["38%", "54%", "44%", "80%", "62%", "92%"]

export function CityCtaSection() {
  return (
    <Section dark className="relative overflow-hidden text-center">
      <div
        className="pointer-events-none absolute top-[-40%] left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-[50px]"
        style={{
          background: "radial-gradient(circle, rgba(190,232,62,.08), transparent 65%)",
        }}
      />

      <Reveal>
        <Kicker className="mx-auto w-fit">Expansão guiada por você</Kicker>
      </Reveal>
      <Reveal delay={1}>
        <h2 className="relative mx-auto mb-4.5 max-w-[680px] text-[clamp(1.8rem,3.6vw,2.6rem)] font-extrabold tracking-[-0.03em]">
          Quer que a RUMO chegue primeiro na <Highlight>sua cidade?</Highlight>
        </h2>
      </Reveal>
      <Reveal delay={2}>
        <p className="text-muted-foreground relative mx-auto mb-10 max-w-[540px] text-[clamp(1.02rem,1.5vw,1.18rem)] leading-[1.65]">
          A demanda por região ajuda a orientar o planejamento da plataforma. Cada
          cadastro contribui para entendermos onde existe mais interesse pela RUMO.
        </p>
      </Reveal>

      <Reveal delay={2}>
        <div className="relative mx-auto mb-11 flex max-w-[760px] flex-wrap justify-center gap-2.5">
          {CITIES.map((city) => (
            <span
              key={city}
              className="text-muted-foreground hover:border-rumo-lime hover:text-foreground flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.03] px-4.5 py-2.25 text-[0.88rem] font-medium transition-[border-color,color,transform] hover:-translate-y-0.5"
            >
              <span className="bg-rumo-lime size-1.5 rounded-full" />
              {city}
            </span>
          ))}
          <span className="text-rumo-lime flex items-center rounded-full border border-dashed border-white/14 px-4.5 py-2.25 text-[0.88rem] font-semibold">
            + a sua cidade
          </span>
        </div>
      </Reveal>

      <Reveal delay={2}>
        <div className="relative mx-auto mb-8.5 grid max-w-[760px] gap-3.5 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[20px] border border-white/14 bg-white/[0.035] p-4.5 text-left backdrop-blur-md">
            <b className="text-foreground text-[0.9rem]">Sinal de demanda por região</b>
            <span className="text-muted-foreground mt-1 block text-[0.78rem]">
              Quanto mais gente se cadastra, mais clareza temos sobre interesse local e
              prioridades de planejamento.
            </span>
            <div className="mt-4.5 flex h-[78px] items-end gap-2" aria-hidden="true">
              {SIGNAL_BAR_HEIGHTS.map((height, index) => (
                <i
                  key={index}
                  style={{ height }}
                  className="from-rumo-lime to-rumo-lime/15 block min-h-[18px] flex-1 rounded-t-lg rounded-b-sm bg-gradient-to-b"
                />
              ))}
            </div>
          </div>
          <div className="rounded-[20px] border border-white/14 bg-white/[0.035] p-4.5 text-left backdrop-blur-md">
            <b className="text-foreground text-[0.9rem]">Base em construção</b>
            <span className="text-muted-foreground mt-1 block text-[0.78rem]">
              Os cadastros ajudam a formar uma visão mais precisa do público interessado
              antes do lançamento.
            </span>
          </div>
        </div>
      </Reveal>

      <Reveal delay={3}>
        <Button asChild size="lg" className="relative">
          <a href={`#${WAITLIST_SECTION_ID}`}>Registrar meu interesse →</a>
        </Button>
      </Reveal>
    </Section>
  )
}
