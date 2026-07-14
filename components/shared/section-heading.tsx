import { cn } from "@/lib/utils"
import { Kicker } from "@/components/shared/kicker"

export function SectionHeading({
  kicker,
  title,
  lead,
  center = false,
  className,
  maxWidthClassName = "max-w-[620px]",
}: {
  kicker?: React.ReactNode
  title: React.ReactNode
  lead?: React.ReactNode
  center?: boolean
  className?: string
  maxWidthClassName?: string
}) {
  return (
    <div
      className={cn(
        "mb-14",
        maxWidthClassName,
        center && "mx-auto text-center",
        className
      )}
    >
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      <h2 className="text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.1] font-extrabold tracking-[-0.03em]">
        {title}
      </h2>
      {lead ? (
        <p className="text-muted-foreground mt-4 text-[clamp(1.02rem,1.5vw,1.18rem)] leading-[1.65] tracking-[-0.01em]">
          {lead}
        </p>
      ) : null}
    </div>
  )
}
