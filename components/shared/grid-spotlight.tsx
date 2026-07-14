"use client"

import { useRef } from "react"

import { cn } from "@/lib/utils"

/**
 * Grade sutil + spotlight que segue o cursor, via CSS custom properties
 * (leve: 1 nó DOM, sem centenas de divs). Usado no fundo do hero.
 */
export function GridSpotlight({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (frame.current) cancelAnimationFrame(frame.current)
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    frame.current = requestAnimationFrame(() => {
      ref.current?.style.setProperty("--spot-x", `${x}px`)
      ref.current?.style.setProperty("--spot-y", `${y}px`)
    })
  }

  return (
    <div
      ref={ref}
      aria-hidden="true"
      onPointerMove={handlePointerMove}
      className={cn("grid-spotlight pointer-events-auto absolute inset-0", className)}
      style={{
        maskImage: "radial-gradient(ellipse 85% 65% at 50% 12%, #000 30%, transparent 75%)",
      }}
    />
  )
}
