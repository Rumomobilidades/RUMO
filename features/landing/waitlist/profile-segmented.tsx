"use client"

import { cn } from "@/lib/utils"
import {
  WAITLIST_PROFILES,
  type WaitlistProfile,
} from "@/features/landing/waitlist/schema"

const LABELS: Record<WaitlistProfile, string> = {
  passageiro: "Passageiro",
  motorista: "Motorista",
  empresa: "Empresa",
}

export function ProfileSegmented({
  value,
  onChange,
}: {
  value?: WaitlistProfile
  onChange: (value: WaitlistProfile) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Seu perfil">
      {WAITLIST_PROFILES.map((profile) => (
        <button
          key={profile}
          type="button"
          role="radio"
          aria-checked={value === profile}
          onClick={() => onChange(profile)}
          className={cn(
            "text-muted-foreground rounded-[11px] border px-1.5 py-3 text-center text-[0.85rem] font-medium transition-all",
            value === profile
              ? "border-primary bg-accent text-primary font-semibold shadow-[inset_0_0_0_1px_var(--primary)]"
              : "border-input hover:border-muted-foreground/40"
          )}
        >
          {LABELS[profile]}
        </button>
      ))}
    </div>
  )
}
