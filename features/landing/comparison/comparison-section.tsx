import { Section } from "@/components/shared/section"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/shared/reveal"
import { CheckList } from "@/components/shared/check-list"

const OUT_ITEMS = [
  "Descobrir o lançamento só depois que as primeiras vagas já se foram",
  "Ficar de fora da lista de fundadores — e dos benefícios que só ela tem",
  "Ver a sua cidade entrar no mapa por último",
]

const IN_ITEMS = [
  { strong: "Lugar garantido", rest: "na lista de fundadores da RUMO" },
  { strong: "Prioridade de convite", rest: "assim que as primeiras vagas abrirem" },
  { strong: "Voz na construção", rest: "do produto, desde o início" },
]

export function ComparisonSection() {
  return (
    <Section tone="muted">
      <Reveal>
        <SectionHeading
          center
          maxWidthClassName="max-w-[680px]"
          kicker="Duas versões do mesmo lançamento"
          title="Não é sobre deixar um e-mail. É sobre garantir seu lugar antes de todo mundo."
        />
      </Reveal>

      <div className="grid gap-4.5 md:grid-cols-2">
        <Reveal className="rounded-[22px] border border-border bg-white p-7.5 shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-md">
          <h3 className="mb-5.5 text-[1.25rem]">Ficar de fora</h3>
          <CheckList items={OUT_ITEMS} icon="x" />
        </Reveal>

        <Reveal
          delay={1}
          className="sec-dark rounded-[22px] border border-rumo-lime/28 bg-gradient-to-br from-[#0C100E] to-[#17251B] p-7.5 text-foreground shadow-[0_28px_70px_-38px_rgba(14,138,69,.6)] transition-transform duration-300 hover:-translate-y-1"
        >
          <h3 className="mb-5.5 text-[1.25rem]">Entrar agora</h3>
          <CheckList items={IN_ITEMS} icon="check" />
        </Reveal>
      </div>
    </Section>
  )
}
