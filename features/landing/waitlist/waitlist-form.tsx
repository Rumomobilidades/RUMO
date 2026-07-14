"use client"

import { Controller } from "react-hook-form"

import { Button } from "@/components/ui/button"
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

  if (isSuccess) {
    return <WaitlistSuccess />
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate>
        <div className="mb-5.5 grid grid-cols-3 gap-1.5" aria-hidden="true">
          <span className="from-primary to-rumo-green-bright h-1.25 rounded-full bg-gradient-to-r" />
          <span className="bg-border h-1.25 rounded-full" />
          <span className="bg-border h-1.25 rounded-full" />
        </div>

        <h3 className="mb-1.5 text-[1.3rem] tracking-[-0.025em]">Garanta sua vaga</h3>
        <p className="text-muted-foreground mb-6.5 text-[0.88rem]">
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
                  <Input placeholder="voce@email.com" autoComplete="email" {...field} />
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

        {form.formState.errors.root ? (
          <p className="text-destructive mb-4 text-sm">
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? "Enviando..." : "Garantir minha vaga →"}
        </Button>

        <p className="text-rumo-dim mt-3.5 text-center text-[0.74rem]">
          Dados protegidos pela LGPD. Sem spam, saia quando quiser.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2.5">
          {["LGPD", "Sem cobrança", "Sem spam"].map((badge) => (
            <span
              key={badge}
              className="border-border bg-muted/60 text-rumo-dim rounded-full border px-2.5 py-1.5 text-[0.72rem]"
            >
              {badge}
            </span>
          ))}
        </div>
      </form>
    </Form>
  )
}
