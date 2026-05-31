"use client"

import { useId } from "react"

import { useShouldAnimate } from "@/hooks/use-should-animate"
import type { Skill } from "@/lib/content/skills"

interface StackMarqueeProps {
  skills: readonly Skill[]
}

export function StackMarquee({ skills }: StackMarqueeProps) {
  const shouldAnimate = useShouldAnimate()
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="px-4 py-16 sm:px-8 lg:px-12"
    >
      <h2
        id={headingId}
        className="mb-6 font-mono text-sm tracking-wider text-muted-foreground uppercase"
      >
        Stack
      </h2>

      {shouldAnimate ? (
        <div className="overflow-hidden">
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
            <ul className="flex gap-2 pr-2" role="list">
              {skills.map((skill) => (
                <li key={skill.name}>
                  <span className="inline-block rounded border border-hairline px-2 py-1 font-mono text-[11px] whitespace-nowrap">
                    {skill.name}
                  </span>
                </li>
              ))}
            </ul>
            <ul aria-hidden="true" className="flex gap-2 pr-2" role="list">
              {skills.map((skill) => (
                <li key={skill.name}>
                  <span className="inline-block rounded border border-hairline px-2 py-1 font-mono text-[11px] whitespace-nowrap">
                    {skill.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <ul className="flex flex-wrap gap-2" role="list">
          {skills.map((skill) => (
            <li key={skill.name}>
              <span className="inline-block rounded border border-hairline px-2 py-1 font-mono text-[11px] whitespace-nowrap">
                {skill.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
