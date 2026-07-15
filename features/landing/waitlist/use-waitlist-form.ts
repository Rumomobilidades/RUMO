"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"

import { readPageContext, readTrackingParamsFromLocation } from "@/lib/utm"
import { WAITLIST_EMAIL_STORAGE_KEY } from "@/lib/constants"
import { trackLeadEvent } from "@/services/analytics"
import {
  waitlistSchema,
  type WaitlistApiResponse,
  type WaitlistFormInput,
  type WaitlistFormValues,
} from "@/features/landing/waitlist/schema"

const FORM_FIELD_NAMES = new Set(Object.keys(waitlistSchema.shape))

async function submitWaitlistEntry(
  values: WaitlistFormValues
): Promise<WaitlistApiResponse> {
  const response = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  })

  return (await response.json()) as WaitlistApiResponse
}

export function useWaitlistForm() {
  const form = useForm<WaitlistFormInput, unknown, WaitlistFormValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      website: "",
      lgpd_consent: false,
    },
  })

  useEffect(() => {
    const prefillEmail = window.sessionStorage.getItem(WAITLIST_EMAIL_STORAGE_KEY)
    if (prefillEmail) form.setValue("email", prefillEmail)
  }, [form])

  const mutation = useMutation({
    mutationFn: submitWaitlistEntry,
  })

  const onSubmit = form.handleSubmit(async (values) => {
    const tracking = readTrackingParamsFromLocation()
    const pageContext = readPageContext()
    const result = await mutation.mutateAsync({ ...values, ...tracking, ...pageContext })

    if (!result.success) {
      if (result.error.code === "duplicate_email") {
        form.setError("email", { message: result.error.message })
        return
      }

      if (result.error.code === "validation_error" && result.issues?.length) {
        for (const issue of result.issues) {
          if (FORM_FIELD_NAMES.has(issue.path)) {
            form.setError(issue.path as keyof WaitlistFormInput, {
              message: issue.message,
            })
          } else {
            form.setError("root", { message: issue.message })
          }
        }
        return
      }

      form.setError("root", { message: result.error.message })
      return
    }

    window.sessionStorage.removeItem(WAITLIST_EMAIL_STORAGE_KEY)
    trackLeadEvent({ profile: values.profile })
  })

  const isSuccess = mutation.isSuccess && mutation.data?.success === true

  return { form, onSubmit, isSuccess, isPending: mutation.isPending }
}
