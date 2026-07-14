import { Check, X } from "lucide-react"

import { Section } from "@/components/shared/section"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/shared/reveal"

const OUT_ITEMS = [
  "Não receber comunicações diretas sobre a evolução da plataforma",
  "Não sinalizar seu interesse no tipo de mobilidade que a RUMO está construindo",
  "Ficar distante das próximas atualizações de produto e lançamento",
]

const IN_ITEMS = [
  { strong: "Contato registrado", rest: "na base de interessados da RUMO" },
  { strong: "Comunicações futuras", rest: "sobre novidades, atualizações e lançamento" },
  { strong: "Sinal de demanda", rest: "para orientar os próximos passos do projeto" },
]

export function ComparisonSection() {
  return (
    <Section className="border-border bg-muted/40 border-y">
      <Reveal>
        <SectionHeading
          center
          maxWidthClassName="max-w-[680px]"
          kicker="Lista de interessados, com intenção"
          title="Não é só deixar um e-mail. É ajudar a RUMO a entender a demanda antes do lançamento."
        />
      </Reveal>

      <div className="grid gap-4.5 md:grid-cols-2">
        <Reveal className="border-border rounded-[22px] border bg-white p-7.5 shadow-sm">
          <h3 className="mb-5.5 text-[1.25rem]">Ficar de fora</h3>
          <ul className="grid gap-3.5">
            {OUT_ITEMS.map((item) => (
              <li
                key={item}
                className="text-muted-foreground flex items-start gap-2.5 text-[0.93rem]"
              >
                <X className="text-rumo-dim mt-0.75 size-4.5 flex-none" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal
          delay={1}
          className="sec-dark border-rumo-lime/28 text-foreground rounded-[22px] border bg-gradient-to-br from-[#0C100E] to-[#17251B] p-7.5 shadow-[0_28px_70px_-38px_rgba(14,138,69,.6)]"
        >
          <h3 className="mb-5.5 text-[1.25rem]">Cadastrar interesse</h3>
          <ul className="grid gap-3.5">
            {IN_ITEMS.map((item) => (
              <li
                key={item.strong}
                className="text-muted-foreground flex items-start gap-2.5 text-[0.93rem]"
              >
                <Check
                  className="text-rumo-lime mt-0.75 size-4.5 flex-none"
                  strokeWidth={2.4}
                />
                <span>
                  <b className="text-foreground font-semibold">{item.strong}</b>{" "}
                  {item.rest}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  )
}
