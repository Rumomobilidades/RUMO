import { Container } from "@/components/shared/container"

const PILLS = [
  "Preço fechado",
  "Ganhos mais justos",
  "Empresas com controle",
  "Motoristas verificados",
  "Demanda por cidade",
  "Atualizações de lançamento",
]

export function TrustStrip() {
  const track = [...PILLS, ...PILLS]

  return (
    <section
      aria-label="Diferenciais da RUMO"
      className="border-border bg-background/85 border-b py-7"
    >
      <Container className="flex items-center gap-7">
        <div className="text-rumo-dim shrink-0 text-[0.76rem] font-bold tracking-[0.07em] uppercase">
          Pensada para
        </div>
        <div
          className="flex-1 overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
          }}
        >
          <div className="animate-marquee flex w-max gap-3">
            {track.map((pill, index) => (
              <span
                key={`${pill}-${index}`}
                className="border-border text-muted-foreground inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-[0.86rem] font-semibold whitespace-nowrap shadow-sm"
              >
                <span className="bg-primary size-1.75 rounded-full" />
                {pill}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
