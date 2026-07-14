import { cn } from "@/lib/utils"
import { Container } from "@/components/shared/container"

export function Section({
  id,
  dark = false,
  className,
  containerClassName,
  children,
}: {
  id?: string
  dark?: boolean
  className?: string
  containerClassName?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className={cn("bg-background text-foreground py-24", dark && "sec-dark", className)}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  )
}
