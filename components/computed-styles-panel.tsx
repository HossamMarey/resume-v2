import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

interface ComputedStylesPanelProps extends ComponentProps<"div"> {
  direction?: "vertical" | "horizontal"
}

/**
 * The universal DevTools "Computed" panel idiom (UX-DR1): a `bg-hairline` grid
 * with `gap-px`, whose `bg-surface` cells reveal inset hairline dividers. Pure
 * presentational — used by principles, case-study Decisions/Outcomes, the
 * Sources preview, and REPL output blocks.
 */
export function ComputedStylesPanel({
  direction = "vertical",
  className,
  children,
  ...props
}: ComputedStylesPanelProps) {
  return (
    <div
      data-slot="computed-styles-panel"
      data-direction={direction}
      className={cn(
        "grid gap-px rounded border border-hairline bg-hairline",
        direction === "horizontal" && "auto-cols-fr grid-flow-col",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/** A single `bg-surface` cell of the Computed-styles grid. */
export function ComputedStylesCell({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="computed-styles-cell"
      className={cn("bg-surface p-4", className)}
      {...props}
    />
  )
}
