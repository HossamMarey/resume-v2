"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

import {
  ComputedStylesCell,
  ComputedStylesPanel,
} from "@/components/computed-styles-panel"
import { useShouldAnimate } from "@/hooks/use-should-animate"
import type { Profile } from "@/lib/content/profile"

interface PrinciplesPanelProps {
  principles: Profile["principles"]
}

export function PrinciplesPanel({ principles }: PrinciplesPanelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const shouldAnimate = useShouldAnimate()

  const headingId = "principles-heading"

  return (
    <section
      aria-labelledby={headingId}
      className="px-4 py-16 sm:px-8 lg:px-12"
    >
      <h2
        id={headingId}
        className="mb-6 font-mono text-sm tracking-wider text-muted-foreground uppercase"
      >
        Principles
      </h2>

      <motion.div
        ref={ref}
        initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
        animate={
          shouldAnimate
            ? inView
              ? { opacity: 1, y: 0 }
              : {}
            : { opacity: 1, y: 0 }
        }
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <ComputedStylesPanel className="sm:grid-cols-2">
          {principles.map((principle) => (
            <ComputedStylesCell key={principle.key}>
              <div className="flex flex-col gap-2">
                <h3 className="font-mono text-sm text-lime">
                  {principle.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {principle.body}
                </p>
              </div>
            </ComputedStylesCell>
          ))}
        </ComputedStylesPanel>
      </motion.div>
    </section>
  )
}
