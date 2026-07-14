"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { NAV_LINKS, WAITLIST_SECTION_ID } from "@/lib/constants"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-border bg-background/85 text-foreground border-b shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-transparent text-[#F2F5F2]"
      )}
    >
      <div className="mx-auto flex h-[68px] max-w-[1120px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-11">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[1.22rem] font-extrabold tracking-[-0.03em]"
        >
          <span
            className={cn(
              "grid size-8.5 flex-none place-items-center rounded-[10px] text-[1.05rem] font-extrabold transition-colors duration-300",
              scrolled
                ? "bg-primary text-primary-foreground"
                : "bg-rumo-lime text-rumo-ink"
            )}
          >
            R
          </span>
          RUMO
        </Link>

        <div className="hidden items-center gap-7 text-sm font-medium opacity-85 min-[861px]:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-opacity hover:opacity-100"
            >
              {link.label}
            </a>
          ))}
        </div>

        <Button
          asChild
          className={cn(
            !scrolled && "bg-rumo-lime text-rumo-ink hover:bg-rumo-lime-soft"
          )}
        >
          <a href={`#${WAITLIST_SECTION_ID}`}>Cadastrar interesse</a>
        </Button>
      </div>
    </nav>
  )
}
