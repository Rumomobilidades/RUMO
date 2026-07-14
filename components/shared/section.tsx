import { cn } from "@/lib/utils"
import { Container } from "@/components/shared/container"

export type SectionTone = "light" | "muted" | "dark"

const TONE_CLASSES: Record<SectionTone, string> = {
  light: "bg-background text-foreground",
  muted: "bg-muted/60 text-foreground border-y border-border",
  dark: "sec-dark bg-background text-foreground",
}

export function Section({
  id,
  tone = "light",
  className,
  containerClassName,
  children,
}: {
  id?: string
  tone?: SectionTone
  className?: string
  containerClassName?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={cn("py-24 sm:py-28", TONE_CLASSES[tone], className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  )
}
