"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { Controller } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useWaitlistForm } from "@/features/landing/waitlist/use-waitlist-form"
import { WaitlistSuccess } from "@/features/landing/waitlist/waitlist-success"
import { ProfileSegmented } from "@/features/landing/waitlist/profile-segmented"

export function WaitlistForm() {
  const { form, onSubmit, isSuccess, isPending } = useWaitlistForm()

  return (
    <AnimatePresence mode="wait">
      {isSuccess ? (
        <WaitlistSuccess key="success" />
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Form {...form}>
            <form onSubmit={onSubmit} noValidate>
              <div className="mb-5.5 grid grid-cols-3 gap-1.5" aria-hidden="true">
                <span className="h-1.25 rounded-full bg-gradient-to-r from-primary to-rumo-green-bright" />
                <span className="h-1.25 rounded-full bg-border" />
                <span className="h-1.25 rounded-full bg-border" />
              </div>

              <h3 className="mb-1.5 text-[1.3rem] tracking-[-0.025em]">
                Garanta sua vaga
              </h3>
              <p className="mb-6.5 text-[0.88rem] text-muted-foreground">
                Menos de um minuto. A primeira leva de convites é limitada.
              </p>

              {/* honeypot: invisível para humanos, capturado por bots de preenchimento automático */}
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute left-[-9999px] opacity-0"
                  />
                )}
              />

              <div className="mb-4 grid gap-4 min-[481px]:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="min-[481px]:col-span-2">
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="min-[481px]:col-span-2">
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="voce@email.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="min-[481px]:col-span-2">
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(47) 99999-9999"
                          inputMode="numeric"
                          autoComplete="tel"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sua cidade"
                          autoComplete="address-level2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="SC"
                          maxLength={2}
                          autoComplete="address-level1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mb-5.5">
                <FormLabel className="mb-2 block">Você é...</FormLabel>
                <Controller
                  control={form.control}
                  name="profile"
                  render={({ field }) => (
                    <ProfileSegmented value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="lgpd_consent"
                render={({ field }) => (
                  <FormItem className="mb-5.5 flex flex-row items-start gap-2.5">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-invalid={!!form.formState.errors.lgpd_consent}
                      />
                    </FormControl>
                    <div className="grid gap-1 leading-none">
                      <FormLabel className="text-[0.82rem] leading-[1.45] font-normal text-muted-foreground">
                        Autorizo o armazenamento dos meus dados para receber
                        novidades sobre a plataforma.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {form.formState.errors.root ? (
                <p className="mb-4 text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              ) : null}

              <Button
                type="submit"
                className="btn-shine w-full"
                size="lg"
                disabled={isPending}
              >
                {isPending ? (
                  <span className="relative z-2 inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Enviando...
                  </span>
                ) : (
                  <span className="relative z-2">Garantir minha vaga →</span>
                )}
              </Button>

              <p className="mt-3.5 text-center text-[0.74rem] text-rumo-dim">
                Dados protegidos pela LGPD. Sem spam, saia quando quiser.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                {["LGPD", "Sem cobrança", "Sem spam"].map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-border bg-muted/60 px-2.5 py-1.5 text-[0.72rem] text-rumo-dim"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </form>
          </Form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
