"use client"

import { motion } from "framer-motion"

import { useShouldAnimate } from "@/hooks/use-should-animate"

interface XPToastProps {
  delta: number
  reason: string
}

function formatReason(reason: string): string {
  const [kind, target] = reason.split(":")
  if (!target) return reason
  const name = target.charAt(0).toUpperCase() + target.slice(1)
  if (kind === "visit") return `visited ${name}`
  if (kind === "open") return `opened ${name}`
  return name
}

export function XPToast({ delta, reason }: XPToastProps) {
  const shouldAnimate = useShouldAnimate()
  if (!shouldAnimate) return null

  return (
    <motion.span
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: [0, 1, 0], y: -8 }}
      transition={{ duration: 1.2, ease: "easeOut", times: [0, 0.2, 1] }}
      className="pointer-events-none absolute end-0 top-full z-50 mt-1 inline-block rounded-full border border-hairline bg-surface px-2 py-0.5 font-mono text-xs whitespace-nowrap text-lime"
    >
      +{delta} {formatReason(reason)}
    </motion.span>
  )
}
