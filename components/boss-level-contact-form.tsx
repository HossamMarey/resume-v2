"use client"

import type { KeyboardEvent } from "react"

import { useId, useRef, useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTypewriter } from "@/hooks/use-typewriter"
import { contactSchema } from "@/lib/schemas/contact"
import { cn } from "@/lib/utils"

const FIELDS = [
  {
    name: "name" as const,
    label: "// who's asking?",
    placeholder: "Ahmed Pasha",
    type: "text" as const,
    required: true,
  },
  {
    name: "email" as const,
    label: "// where do I reply?",
    placeholder: "ahmed@example.com",
    type: "email" as const,
    required: true,
  },
  {
    name: "subject" as const,
    label: "// re: (optional)",
    placeholder: "Project inquiry",
    type: "text" as const,
    required: false,
  },
  {
    name: "message" as const,
    label: "// your move.",
    placeholder: "Tell me about your project, timeline, and budget...",
    type: "textarea" as const,
    required: true,
  },
]

type FieldName = (typeof FIELDS)[number]["name"]

function isFieldValid(name: FieldName, value: string): boolean {
  const fieldSchema = contactSchema.shape[name]
  const result = fieldSchema.safeParse(value)
  return result.success
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
}: FieldRowProps) {
  const { text: typewriterText } = useTypewriter(label, {
    enabled: true,
    speedMs: 30,
  })

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
    </div>
  )
}

export function BossLevelContactForm() {
  const baseId = useId()
  const [values, setValues] = useState<Record<FieldName, string>>({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [revealed, setRevealed] = useState<Set<FieldName>>(
    () => new Set(["name"])
  )
  const fieldRefs = useRef<
    Array<HTMLInputElement | HTMLTextAreaElement | null>
  >([])

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

    // Focus the next field on the next tick so it's rendered
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
      // Textarea is terminal — native newline, no advance
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
      return
    }
  }

  const handleChange = (name: FieldName, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const isMessageRevealed = revealed.has("message")

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="space-y-4"
      aria-live="polite"
    >
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
          />
        )
      })}

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
          disabled
          className="inline-flex items-center gap-2 rounded border border-lime/50 bg-lime/10 py-2 ps-4 pe-4 font-mono text-sm text-lime opacity-50"
        >
          send →
        </button>
      )}
    </form>
  )
}
