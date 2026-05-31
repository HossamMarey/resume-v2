"use client"

import { motion, useInView } from "framer-motion"
import { useEffect, useRef, useState } from "react"

import { useShouldAnimate } from "@/hooks/use-should-animate"
import { cn } from "@/lib/utils"

interface ScoreRingProps {
  label: string
  value: string
  suffix?: string
  delay?: number
}

export function ScoreRing({ label, value, suffix, delay = 0 }: ScoreRingProps) {
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, "")) || 0

  if (numericValue === 0) return null

  return (
    <InnerScoreRing
      label={label}
      value={value}
      numericValue={numericValue}
      suffix={suffix}
      delay={delay}
    />
  )
}

interface InnerScoreRingProps {
  label: string
  value: string
  numericValue: number
  suffix?: string
  delay: number
}

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const STROKE_WIDTH = 3
const ANIMATION_DURATION = 1100
const VIEWBOX = 120
const CENTER = VIEWBOX / 2

function InnerScoreRing({
  label,
  value,
  numericValue,
  suffix,
  delay,
}: InnerScoreRingProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const shouldAnimate = useShouldAnimate()
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    if (!shouldAnimate || !inView) return

    let raf = 0
    let start = 0

    function tick(now: number) {
      if (start === 0) start = now
      const elapsed = now - start
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedValue(eased * numericValue)
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      }
    }

    const timeout = setTimeout(() => {
      raf = requestAnimationFrame(tick)
    }, delay * 1000)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(raf)
    }
  }, [shouldAnimate, inView, delay, numericValue])

  const displayValue = shouldAnimate ? animatedValue : numericValue
  const ringDrawn = !shouldAnimate || inView

  return (
    <figure
      ref={ref}
      aria-label={`${label}: ${value}${suffix ?? ""}`}
      className={cn(
        "flex flex-col items-center gap-2",
        "h-24 w-24 sm:h-32 sm:w-32"
      )}
    >
      <div className="relative h-full w-full">
        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          className="h-full w-full -rotate-90"
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            stroke="var(--surface-2)"
          />
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            stroke="var(--lime)"
            strokeDasharray={CIRCUMFERENCE}
            initial={{
              strokeDashoffset: shouldAnimate ? CIRCUMFERENCE : 0,
            }}
            animate={{
              strokeDashoffset: ringDrawn ? 0 : CIRCUMFERENCE,
            }}
            transition={{
              duration: shouldAnimate ? 1.1 : 0.001,
              delay: shouldAnimate ? delay : 0,
              ease: "easeOut",
            }}
          />
        </svg>
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center font-mono text-lg font-semibold text-foreground sm:text-2xl"
        >
          {Math.round(displayValue)}
          {suffix}
        </span>
      </div>
      <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
    </figure>
  )
}
