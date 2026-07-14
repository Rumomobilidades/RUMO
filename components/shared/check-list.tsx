import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"

export type CheckListItem = string | { strong: string; rest: string }

export function CheckList({
  items,
  icon = "check",
  className,
}: {
  items: CheckListItem[]
  icon?: "check" | "x"
  className?: string
}) {
  const Icon = icon === "check" ? Check : X

  return (
    <ul className={cn("flex flex-col gap-3.5", className)}>
      {items.map((item) => {
        const key = typeof item === "string" ? item : item.strong
        return (
          <li
            key={key}
            className="flex items-start gap-2.5 text-[0.94rem] text-muted-foreground"
          >
            <Icon
              aria-hidden="true"
              className={cn(
                "mt-0.75 size-4.5 flex-none",
                icon === "check" ? "text-rumo-lime" : "text-rumo-dim"
              )}
              strokeWidth={2.4}
            />
            {typeof item === "string" ? (
              <span>{item}</span>
            ) : (
              <span>
                <b className="font-semibold text-foreground">{item.strong}</b> {item.rest}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
