"use client"

import { motion } from "framer-motion"

import { clampXp } from "@/lib/xp/bus"
import { useShouldAnimate } from "@/hooks/use-should-animate"

interface XPBarProps {
  xp: number
}

export function XPBar({ xp }: XPBarProps) {
  const shouldAnimate = useShouldAnimate()
  if (!shouldAnimate) return null

  const value = clampXp(xp)

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Site exploration XP"
      className="hidden h-2 w-16 overflow-hidden rounded-full border border-hairline bg-surface sm:block sm:w-32"
    >
      <motion.div
        className="h-full origin-left rounded-full bg-lime"
        initial={false}
        animate={{ scaleX: value / 100 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  )
}
