"use client"

import { Check } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { SITE } from "@/lib/constants"

export function WaitlistSuccess() {
  async function handleCopyLink() {
    await navigator.clipboard.writeText(SITE.url)
    toast.success("Link copiado! Compartilhe com quem também quer entrar na frente.")
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 py-4 text-center duration-500">
      <div className="bg-accent mx-auto mb-5.5 grid size-16.5 place-items-center rounded-full">
        <Check className="text-primary size-7.5" strokeWidth={2.5} />
      </div>
      <h3 className="mb-2.5 text-[1.35rem]">Vaga garantida ✓</h3>
      <p className="text-muted-foreground mx-auto mb-6.5 max-w-[340px] text-[0.92rem]">
        Você está na lista. Assim que a RUMO chegar na sua cidade, você é avisado em
        primeira mão — e cada amigo que entrar puxa sua cidade ainda mais pra frente.
      </p>
      <Button variant="outline" onClick={handleCopyLink}>
        Copiar link para convidar amigos
      </Button>
    </div>
  )
}
