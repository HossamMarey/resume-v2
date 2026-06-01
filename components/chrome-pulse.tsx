"use client"

import { motion } from "framer-motion"

import { useShouldAnimate } from "@/hooks/use-should-animate"

interface ChromePulseProps {
  active: boolean
  onDone?: () => void
}

export function ChromePulse({ active, onDone }: ChromePulseProps) {
  const animate = useShouldAnimate()

  if (!animate || !active) {
    if (active && onDone) onDone()
    return null
  }

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60]"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.6, 0] }}
      transition={{ duration: 0.8, times: [0, 0.5, 1] }}
      onAnimationComplete={onDone}
    >
      <div className="absolute inset-0 rounded-lg ring-4 ring-lime/30" />
    </motion.div>
  )
}
