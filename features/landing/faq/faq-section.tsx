import { Section } from "@/components/shared/section"
import { SectionHeading } from "@/components/shared/section-heading"
import { Reveal } from "@/components/shared/reveal"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
  {
    question: "Entrar na lista custa alguma coisa?",
    answer:
      "Não. O cadastro é 100% gratuito e continua gratuito. Você só garante seu convite prioritário e os benefícios de fundador.",
  },
  {
    question: "Estou me comprometendo com algo?",
    answer:
      "Zero compromisso. Se quando o convite chegar você não quiser usar, é só ignorar. Sua vaga não gera nenhuma obrigação — mas os benefícios de fundador, sim, são só de quem entrou antes.",
  },
  {
    question: "Quando recebo meu convite?",
    answer:
      "Os convites saem em levas, por ordem de cadastro e por cidade. Quanto antes você entra, mais cedo o seu chega — e quem está na lista é sempre avisado primeiro.",
  },
  {
    question: "Sou motorista. O que preciso para começar?",
    answer:
      "Por agora, basta entrar na lista com seus dados de contato. Antes do seu acesso ser liberado, você recebe a lista completa de requisitos (CNH com EAR e documentação do veículo) com antecedência para se preparar.",
  },
  {
    question: "Minha cidade não está na lista. Posso me cadastrar?",
    answer:
      "Pode e deve. A expansão é definida pela demanda: cada cadastro puxa sua cidade para a frente da fila. Cidades que ninguém esperava já subiram de posição exatamente assim.",
  },
  {
    question: "O que acontece com meus dados?",
    answer:
      "Eles servem para uma única coisa: avisar você sobre seu convite e seus benefícios. Em conformidade com a LGPD, sem spam e sem repasse a terceiros. Você sai da lista quando quiser, com um clique.",
  },
]

export function FaqSection() {
  return (
    <Section id="faq">
      <Reveal>
        <SectionHeading
          center
          kicker="Sem letras miúdas"
          title="O que você precisa saber antes de entrar"
        />
      </Reveal>

      <Reveal className="mx-auto max-w-[720px]">
        <Accordion type="single" collapsible>
          {FAQS.map((faq, index) => (
            <AccordionItem key={faq.question} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-[1.02rem] font-semibold tracking-[-0.015em]">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground max-w-[620px] text-[0.95rem] leading-[1.7]">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </Section>
  )
}
