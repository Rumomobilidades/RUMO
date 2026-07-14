"use client"

import { motion } from "framer-motion"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { SITE } from "@/lib/constants"

export function WaitlistSuccess() {
  async function handleCopyLink() {
    await navigator.clipboard.writeText(SITE.url)
    toast.success("Link copiado! Compartilhe com quem também quer entrar na frente.")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="py-4 text-center"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
        className="mx-auto mb-5.5 grid size-16.5 place-items-center rounded-full bg-accent"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-7.5 text-primary">
          <motion.path
            d="M4 12.5 9.5 18 20 6"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
          />
        </svg>
      </motion.div>

      <h3 className="mb-2.5 text-[1.35rem] tracking-[-0.02em]">
        Cadastro realizado com sucesso.
      </h3>
      <p className="mx-auto mb-6.5 max-w-[380px] text-[0.92rem] leading-[1.6] text-muted-foreground">
        Obrigado pelo interesse. Você agora faz parte da nossa lista de pessoas que
        receberão novidades, acesso antecipado e atualizações importantes da RUMO.
        Quando estivermos prontos para abrir as primeiras vagas, você será um dos
        primeiros a saber.
      </p>
      <Button variant="outline" onClick={handleCopyLink}>
        Copiar link para convidar amigos
      </Button>
    </motion.div>
  )
}
