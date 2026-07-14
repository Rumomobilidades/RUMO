import { cn } from "@/lib/utils"

/** Marca-texto (fundo lima) usado em destaques dentro de títulos. */
export function Highlight({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <span className={cn("text-highlight", className)}>{children}</span>
}

/** Texto em degradê verde-lima, usado no hero e no CTA final sobre fundo escuro. */
export function GradientText({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <span className={cn("text-gradient-lime", className)}>{children}</span>
}
