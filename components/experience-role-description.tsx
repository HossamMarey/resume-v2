"use client"

import { useState, useRef, useEffect } from "react"

interface ExperienceRoleDescriptionProps {
  description: string
}

export function ExperienceRoleDescription({
  description,
}: ExperienceRoleDescriptionProps) {
  const [expanded, setExpanded] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  const paragraphRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = paragraphRef.current
    if (!el) return

    const check = () => {
      // Only set to true; once overflow is detected it stays true
      // so the toggle remains available after expanding
      if (el.scrollHeight > el.clientHeight) {
        setHasOverflow(true)
      }
    }

    check()

    const observer = new ResizeObserver(check)
    observer.observe(el)

    // Re-check after fonts load since they may change line heights
    document.fonts.ready.then(check)

    return () => observer.disconnect()
  }, [description])

  const id = `role-desc-${description.slice(0, 20).replace(/\s+/g, "-")}`

  return (
    <div>
      <p
        ref={paragraphRef}
        id={id}
        className={`mt-1 text-sm text-muted-foreground ${
          expanded ? "" : "line-clamp-2"
        }`}
      >
        {description}
      </p>
      {hasOverflow && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 font-mono text-xs text-lime hover:underline focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  )
}
