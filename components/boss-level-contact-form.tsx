"use client"

import type { FormEvent, KeyboardEvent } from "react"

import { useEffect, useId, useRef, useState } from "react"

import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useTypewriter } from "@/hooks/use-typewriter"
import { emitXP } from "@/lib/xp/bus"
import { contactSchema } from "@/lib/schemas/contact"
import { cn } from "@/lib/utils"

const FIELDS = [
  {
    name: "name" as const,
    label: "// who's asking?",
    placeholder: "Ahmed Pasha",
    type: "text" as const,
    required: true,
    ruleName: "name",
  },
  {
    name: "email" as const,
    label: "// where do I reply?",
    placeholder: "ahmed@example.com",
    type: "email" as const,
    required: true,
    ruleName: "email",
  },
  {
    name: "subject" as const,
    label: "// re: (optional)",
    placeholder: "Project inquiry",
    type: "text" as const,
    required: false,
    ruleName: "subject",
  },
  {
    name: "message" as const,
    label: "// your move.",
    placeholder: "Tell me about your project, timeline, and budget...",
    type: "textarea" as const,
    required: true,
    ruleName: "message_length",
  },
] as const

type FieldName = (typeof FIELDS)[number]["name"]

function isFieldValid(name: FieldName, value: string): boolean {
  const fieldSchema = contactSchema.shape[name]
  const result = fieldSchema.safeParse(value)
  return result.success
}

function getFieldError(name: FieldName, value: string): string | null {
  const fieldSchema = contactSchema.shape[name]
  const result = fieldSchema.safeParse(value)
  if (result.success) return null
  return result.error.issues[0]?.message ?? "invalid"
}

interface TestLineProps {
  name: FieldName
  value: string
  ruleName: string
  debouncedValue: string
  touched: boolean
}

function TestLine({
  name,
  value,
  ruleName,
  debouncedValue,
  touched,
}: TestLineProps) {
  const hasContent = value.length > 0
  // Always show validation line for revealed fields that are touched or have content.
  // For optional fields (subject), empty is valid — show ✓ even if untouched.
  const isOptionalField = name === "subject"
  const shouldShow = touched || hasContent || isOptionalField
  if (!shouldShow) return null

  const isValid = isFieldValid(name, debouncedValue)
  const error = getFieldError(name, debouncedValue)

  if (isValid) {
    return (
      <span className="block font-mono text-xs text-lime">
        {`✓ ${ruleName}`}
      </span>
    )
  }

  return (
    <span className="block font-mono text-xs text-status-err">
      {`✗ ${ruleName} — ${error}`}
    </span>
  )
}

interface FieldRowProps {
  name: FieldName
  label: string
  placeholder: string
  type: "text" | "email" | "textarea"
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  inputRef: (el: HTMLInputElement | HTMLTextAreaElement | null) => void
  id: string
  isValid: boolean
  ruleName: string
  touched: boolean
}

function FieldRow({
  name,
  label,
  placeholder,
  type,
  value,
  onChange,
  onKeyDown,
  inputRef,
  id,
  isValid,
  ruleName,
  touched,
}: FieldRowProps) {
  const { text: typewriterText } = useTypewriter(label, {
    enabled: true,
    speedMs: 30,
  })

  const debouncedValue = useDebouncedValue(value, 150)

  const inputProps = {
    id,
    name,
    value,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    onKeyDown,
    ref: inputRef as unknown as React.Ref<HTMLInputElement>,
    className: cn(
      "!bg-primary/5 font-mono text-sm",
      !isValid && value.length > 0 && "aria-invalid"
    ),
    "aria-invalid": !isValid && value.length > 0 ? true : undefined,
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="font-mono text-xs text-muted-foreground">
        {typewriterText}
      </Label>
      {type === "textarea" ? (
        <Textarea
          {...(inputProps as React.ComponentProps<typeof Textarea>)}
          ref={inputRef as React.Ref<HTMLTextAreaElement>}
          rows={4}
        />
      ) : (
        <Input
          {...inputProps}
          type={type}
          ref={inputRef as React.Ref<HTMLInputElement>}
        />
      )}
      <TestLine
        name={name}
        value={value}
        ruleName={ruleName}
        debouncedValue={debouncedValue}
        touched={touched}
      />
    </div>
  )
}

export function BossLevelContactForm() {
  const baseId = useId()
  const renderedAt = useRef(0)

  useEffect(() => {
    renderedAt.current = Date.now()
  }, [])

  const [values, setValues] = useState<Record<FieldName, string>>({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [touched, setTouched] = useState<Set<FieldName>>(new Set())
  const [revealed, setRevealed] = useState<Set<FieldName>>(
    () => new Set(["name"])
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const fieldRefs = useRef<
    Array<HTMLInputElement | HTMLTextAreaElement | null>
  >([])

  const isFormValid = contactSchema.safeParse(values).success

  const focusField = (index: number) => {
    const el = fieldRefs.current[index]
    if (el) {
      el.focus()
    }
  }

  const revealNext = (fromIndex: number) => {
    const next = FIELDS[fromIndex + 1]
    if (!next) return false

    setRevealed((prev) => {
      const nextSet = new Set(prev)
      nextSet.add(next.name)
      return nextSet
    })

    setTimeout(() => {
      focusField(fromIndex + 1)
    }, 0)

    return true
  }

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => {
    const field = FIELDS[index]
    const value = values[field.name]

    if (e.key === "Enter") {
      if (field.type === "textarea") return

      e.preventDefault()

      if (!isFieldValid(field.name, value)) return

      revealNext(index)
      return
    }

    if (e.key === "ArrowUp") {
      if (field.type === "textarea") return

      e.preventDefault()
      if (index > 0) {
        focusField(index - 1)
      }
      return
    }

    if (e.key === "Escape") {
      e.preventDefault()
      setValues((prev) => ({ ...prev, [field.name]: "" }))
      setTouched((prev) => {
        const next = new Set(prev)
        next.delete(field.name)
        return next
      })
      return
    }
  }

  const handleChange = (name: FieldName, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    setTouched((prev) => {
      const next = new Set(prev)
      next.add(name)
      return next
    })
    if (showThankYou) setShowThankYou(false)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const company = formData.get("company")?.toString() ?? ""

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          subject: values.subject,
          message: values.message,
          company,
          renderedAt: renderedAt.current,
        }),
      })

      if (res.status === 429) {
        toast.error(
          "hm@portfolio: too many attempts. cool down and retry shortly."
        )
        return
      }

      if (!res.ok) {
        toast.error(
          "hm@portfolio: delivery failed. retry, or email hosmarey@gmail.com directly."
        )
        return
      }

      const data = (await res.json()) as { ok: boolean }

      if (data.ok) {
        toast.success(
          "hm@portfolio: message queued. response window: 2 business days."
        )
        emitXP(50, "contact:submit")
        setValues({ name: "", email: "", subject: "", message: "" })
        setTouched(new Set())
        setRevealed(new Set(["name"]))
        setShowThankYou(true)
      } else {
        toast.error(
          "hm@portfolio: delivery failed. retry, or email hosmarey@gmail.com directly."
        )
      }
    } catch {
      toast.error(
        "hm@portfolio: delivery failed. retry, or email hosmarey@gmail.com directly."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isMessageRevealed = revealed.has("message")
  const summaryId = `${baseId}-summary`

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
      <div id={summaryId}>
        {FIELDS.map((field, index) => {
          if (!revealed.has(field.name)) return null

          const id = `${baseId}-${field.name}`
          const isValid = isFieldValid(field.name, values[field.name])

          return (
            <FieldRow
              key={field.name}
              name={field.name}
              label={field.label}
              placeholder={field.placeholder}
              type={field.type}
              value={values[field.name]}
              onChange={(v) => handleChange(field.name, v)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              inputRef={(el) => {
                fieldRefs.current[index] = el
              }}
              id={id}
              isValid={isValid}
              ruleName={field.ruleName}
              touched={touched.has(field.name)}
            />
          )
        })}
      </div>

      {/* Honeypot field — hidden from users and AT */}
      <div className="sr-only absolute">
        <Label htmlFor={`${baseId}-company`} className="sr-only">
          Leave this field empty
        </Label>
        <Input
          id={`${baseId}-company`}
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          defaultValue=""
          className="sr-only"
        />
      </div>

      {isMessageRevealed && (
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          aria-describedby={summaryId}
          className={cn(
            "inline-flex items-center gap-2 rounded border border-lime/50 bg-lime/10 py-2 ps-4 pe-4 font-mono text-sm text-lime",
            (!isFormValid || isSubmitting) && "opacity-50"
          )}
        >
          {isSubmitting ? "running tests…" : "send →"}
        </button>
      )}

      {showThankYou && (
        <p className="font-mono text-sm text-lime">
          {"// transmission received. thank you for reaching out."}
        </p>
      )}
    </form>
  )
}
