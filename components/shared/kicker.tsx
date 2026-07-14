import { cn } from "@/lib/utils"

export function Kicker({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "text-primary mb-3.5 text-[0.8rem] font-bold tracking-[0.06em] uppercase",
        className
      )}
    >
      {children}
    </div>
  )
}
