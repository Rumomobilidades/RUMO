"use client"

import { motion } from "framer-motion"

const DELAY_STEP = 0.08

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  /** Passos de atraso (1 = 0.08s, 2 = 0.16s...), espelhando .reveal.d1/.d2/.d3 do design original. */
  delay?: 0 | 1 | 2 | 3
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.65,
        delay: delay * DELAY_STEP,
        ease: [0.2, 0.8, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
