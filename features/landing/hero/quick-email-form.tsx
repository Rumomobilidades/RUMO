"use client"

import { ArrowRight } from "lucide-react"

import { WAITLIST_EMAIL_STORAGE_KEY, WAITLIST_SECTION_ID } from "@/lib/constants"

export function QuickEmailForm() {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = new FormData(event.currentTarget).get("email")

    if (typeof email === "string" && email) {
      window.sessionStorage.setItem(WAITLIST_EMAIL_STORAGE_KEY, email)
    }

    document.getElementById(WAITLIST_SECTION_ID)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="focus-within:border-rumo-lime focus-within:ring-rumo-lime/10 mb-4 flex max-w-[480px] gap-2.5 rounded-full border border-white/15 bg-white/5 p-1.5 backdrop-blur-sm transition-[border-color,box-shadow] focus-within:ring-4 max-[480px]:flex-col max-[480px]:rounded-[20px] max-[480px]:p-2"
    >
      <input
        type="email"
        name="email"
        placeholder="Seu melhor e-mail"
        autoComplete="email"
        required
        className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-[0.95rem] text-[#F2F5F2] outline-none placeholder:text-[#6B776F]"
      />
      <button
        type="submit"
        className="bg-rumo-lime text-rumo-ink hover:bg-rumo-lime-soft inline-flex flex-none items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.9rem] font-semibold transition-colors max-[480px]:w-full"
      >
        Cadastrar interesse <ArrowRight className="size-4" />
      </button>
    </form>
  )
}
