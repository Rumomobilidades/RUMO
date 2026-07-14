"use client"

import { useRef } from "react"
import { useInView } from "framer-motion"

/** Substitui o IntersectionObserver manual do protótipo original por uma API declarativa. */
export function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return { ref, isInView }
}
