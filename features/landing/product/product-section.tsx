import { Section } from "@/components/shared/section"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/shared/reveal"
import { Counter } from "@/components/shared/counter"

const METRICS = [
  { value: 0, suffix: "", label: "surpresas no destino" },
  { value: 1, suffix: "", label: "painel para toda a operação" },
  { value: 3, suffix: "", label: "perfis, uma só plataforma" },
]

const DASH_ROWS = [
  { label: "Corrida Centro → Praia Brava", value: "R$ 18,90 fechado", accent: true },
  { label: "Repasse estimado ao motorista", value: "visível antes do aceite" },
  { label: "Centro de custo", value: "Marketing · aprovado" },
]

const QUEUE = [
  { city: "Itajaí", status: "alta tração" },
  { city: "Balneário Camboriú", status: "crescendo" },
  { city: "Sua cidade", status: "+1 voto hoje" },
]

export function ProductSection() {
  return (
    <Section id="produto" tone="muted">
      <Reveal>
        <SectionHeading
          kicker="Construída com propósito"
          title="A RUMO nasce para acabar com o que mais incomoda na mobilidade urbana."
          lead="Cada decisão de produto elimina uma fonte de incerteza: no preço, no ganho, no controle — e no momento em que sua cidade entra no mapa."
        />
      </Reveal>

      <div className="grid gap-4.5 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal className="relative overflow-hidden rounded-[22px] border border-border bg-gradient-to-br from-white to-[#F5FAF6] p-7.5 pb-[220px] shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-md min-[921px]:pb-[220px] max-[560px]:pb-7.5">
          <h3 className="mb-2 text-[1.28rem] tracking-[-0.025em]">
            Transparência total, antes da corrida começar
          </h3>
          <p className="max-w-[440px] text-[0.93rem] text-muted-foreground">
            Passageiro sabe o valor. Motorista vê o líquido. Empresa acompanha o custo.
            Ninguém descobre a regra tarde demais.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-2.5 min-[561px]:grid-cols-3">
            {METRICS.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-primary/12 bg-white/75 p-4"
              >
                <div className="text-[1.55rem] font-extrabold tracking-[-0.04em] text-primary">
                  <Counter value={metric.value} suffix={metric.suffix} />
                </div>
                <div className="text-[0.75rem] leading-[1.35] text-muted-foreground">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>

          <div className="absolute right-7.5 bottom-7 left-7.5 rounded-[18px] border border-border bg-white/82 p-4 shadow-md backdrop-blur-lg max-[560px]:static max-[560px]:mt-6">
            {DASH_ROWS.map((row, index) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1fr_auto] gap-3 py-2.5 ${
                  index < DASH_ROWS.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <b className="text-[0.82rem]">{row.label}</b>
                <span
                  className={
                    row.accent
                      ? "text-[0.82rem] font-extrabold text-primary"
                      : "text-[0.78rem] text-muted-foreground"
                  }
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="grid gap-4.5">
          <Reveal
            delay={1}
            className="sec-dark rounded-[22px] border border-border bg-gradient-to-br from-[#101613] to-[#17211B] p-7.5 text-foreground transition-transform duration-300 hover:-translate-y-1"
          >
            <h3 className="mb-2 text-[1.28rem] tracking-[-0.025em]">
              Prioridade decidida pela demanda real
            </h3>
            <p className="text-[0.93rem] text-muted-foreground">
              O lançamento segue o sinal de quem se cadastra. Mais interesse, mais
              prioridade — simples assim.
            </p>
            <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-white/10">
              <span className="animate-rail block h-full w-[72%] rounded-full bg-gradient-to-r from-rumo-lime to-[#58D47C]" />
            </div>
            <div className="mt-5.5 grid gap-2.5">
              {QUEUE.map((item) => (
                <div
                  key={item.city}
                  className="flex justify-between gap-4 rounded-[14px] border border-white/8 bg-white/[0.04] px-3.5 py-3 text-[0.84rem]"
                >
                  <span>{item.city}</span>
                  <strong className="text-rumo-lime">{item.status}</strong>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal
            delay={2}
            className="rounded-[22px] border border-border bg-white p-7.5 shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="mb-2 text-[1.28rem] tracking-[-0.025em]">
              Comunidade de early adopters
            </h3>
            <p className="text-[0.93rem] text-muted-foreground">
              Quem entra agora ajuda a moldar prioridades — e é reconhecido como
              fundador quando a RUMO abrir na sua cidade.
            </p>
          </Reveal>
        </div>
      </div>
    </Section>
  )
}
