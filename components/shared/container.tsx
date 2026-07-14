import { cn } from "@/lib/utils"

export function Container({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1120px] px-5 sm:px-8 lg:px-11", className)}>
      {children}
    </div>
  )
}
