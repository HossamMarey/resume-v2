"use client"

import { motion } from "framer-motion"

import { useShouldAnimate } from "@/hooks/use-should-animate"
import { cn } from "@/lib/utils"
import type { PageWeightItem } from "@/lib/content/page-weight"

interface PageWeightBudgetProps {
  items: readonly PageWeightItem[]
  budgetBytes?: number
}

function formatBytes(b: number): string {
  return b >= 1024 ? `${(b / 1024).toFixed(1)} KB` : `${b} B`
}

const COLOR_MAP: Record<string, string> = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
}

export function PageWeightBudget({
  items,
  budgetBytes = 500_000,
}: PageWeightBudgetProps) {
  const shouldAnimate = useShouldAnimate()
  const total = items.reduce((sum, item) => sum + item.bytes, 0)

  if (total === 0) {
    return (
      <p className="font-mono text-xs text-muted-foreground">
        No page-weight data available.
      </p>
    )
  }

  return (
    <div className="w-full">
      <div
        role="presentation"
        className="flex h-4 overflow-hidden rounded bg-surface-2"
        aria-hidden="true"
      >
        {items.map((item, i) => (
          <motion.div
            key={item.category}
            initial={shouldAnimate ? { scaleX: 0 } : { scaleX: 1 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: shouldAnimate ? 0.7 : 0.001,
              delay: shouldAnimate ? i * 0.05 : 0,
              ease: "easeOut",
            }}
            style={{ width: `${(item.bytes / total) * 100}%` }}
            className={cn(
              "origin-start",
              COLOR_MAP[item.colorToken] ?? "bg-muted"
            )}
          />
        ))}
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {items.map((item) => (
          <div key={item.category} className="flex items-center gap-1.5">
            <dt className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-block size-3 rounded-sm",
                  COLOR_MAP[item.colorToken] ?? "bg-muted"
                )}
              />
              {item.category}
            </dt>
            <dd className="font-mono text-xs text-muted-foreground">
              {formatBytes(item.bytes)}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Total: {formatBytes(total)} / {formatBytes(budgetBytes)}
      </p>
    </div>
  )
}
