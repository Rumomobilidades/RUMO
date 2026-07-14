import { Section } from "@/components/shared/section"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/shared/reveal"

const METRICS = [
  { value: "0", label: "surpresas no destino" },
  { value: "1", label: "painel para operação" },
  { value: "3", label: "perfis no lançamento" },
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
    <Section id="produto">
      <Reveal>
        <SectionHeading
          kicker="Produto com intenção"
          title="A RUMO nasce para corrigir os pontos que mais desgastam a mobilidade urbana."
          lead="Cada fluxo foi desenhado para reduzir incerteza: no preço, no ganho, no controle e no momento em que sua cidade entra no mapa."
        />
      </Reveal>

      <div className="grid gap-4.5 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal className="border-border relative overflow-hidden rounded-[22px] border bg-gradient-to-br from-white to-[#F5FAF6] p-7.5 pb-[220px] shadow-sm max-[560px]:pb-7.5 min-[921px]:pb-[220px]">
          <h3 className="mb-2 text-[1.28rem] tracking-[-0.025em]">
            Transparência visível antes da corrida começar
          </h3>
          <p className="text-muted-foreground max-w-[440px] text-[0.93rem]">
            Passageiro sabe o valor. Motorista vê o líquido. Empresa acompanha o custo. A
            experiência fica mais limpa porque ninguém descobre a regra tarde demais.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-2.5 min-[561px]:grid-cols-3">
            {METRICS.map((metric) => (
              <div
                key={metric.label}
                className="border-primary/12 rounded-2xl border bg-white/75 p-4"
              >
                <div className="text-primary text-[1.55rem] font-extrabold tracking-[-0.04em]">
                  {metric.value}
                </div>
                <div className="text-muted-foreground text-[0.75rem] leading-[1.35]">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>

          <div className="border-border absolute right-7.5 bottom-7 left-7.5 rounded-[18px] border bg-white/82 p-4 shadow-md backdrop-blur-lg max-[560px]:static max-[560px]:mt-6">
            {DASH_ROWS.map((row, index) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1fr_auto] gap-3 py-2.5 ${
                  index < DASH_ROWS.length - 1 ? "border-border border-b" : ""
                }`}
              >
                <b className="text-[0.82rem]">{row.label}</b>
                <span
                  className={
                    row.accent
                      ? "text-primary text-[0.82rem] font-extrabold"
                      : "text-muted-foreground text-[0.78rem]"
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
            className="sec-dark border-border text-foreground rounded-[22px] border bg-gradient-to-br from-[#101613] to-[#17211B] p-7.5"
          >
            <h3 className="mb-2 text-[1.28rem] tracking-[-0.025em]">
              Fila inteligente por cidade
            </h3>
            <p className="text-muted-foreground text-[0.93rem]">
              O lançamento segue o sinal real de demanda. Mais cadastros significam mais
              prioridade.
            </p>
            <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-white/10">
              <span className="animate-rail from-rumo-lime block h-full w-[72%] rounded-full bg-gradient-to-r to-[#58D47C]" />
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
            className="border-border rounded-[22px] border bg-white p-7.5 shadow-sm"
          >
            <h3 className="mb-2 text-[1.28rem] tracking-[-0.025em]">
              Comunidade inicial de interessados
            </h3>
            <p className="text-muted-foreground text-[0.93rem]">
              Quem se cadastra agora ajuda a RUMO a entender demanda, prioridades e
              contexto real antes do lançamento público.
            </p>
          </Reveal>
        </div>
      </div>
    </Section>
  )
}
