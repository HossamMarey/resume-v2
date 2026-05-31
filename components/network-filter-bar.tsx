"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type FilterCategory = "method" | "status" | "year"

export interface AvailableFilters {
  method: string[]
  status: string[]
  year: string[]
}

export interface ActiveFilters {
  method: string[]
  status: string[]
  year: string[]
}

interface NetworkFilterBarProps {
  availableFilters: AvailableFilters
  activeFilters: ActiveFilters
  onToggle: (category: FilterCategory, value: string) => void
  onClear: () => void
}

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  method: "Method",
  status: "Status",
  year: "Year",
}

const CATEGORIES: FilterCategory[] = ["method", "status", "year"]

export function NetworkFilterBar({
  availableFilters,
  activeFilters,
  onToggle,
  onClear,
}: NetworkFilterBarProps) {
  const [openPopover, setOpenPopover] = useState<FilterCategory | null>(null)
  const hasAnyActive = CATEGORIES.some((cat) => activeFilters[cat].length > 0)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {CATEGORIES.map((category) => {
        const label = CATEGORY_LABELS[category]
        const values = availableFilters[category]
        const active = activeFilters[category]
        const isActive = active.length > 0
        const isOpen = openPopover === category

        return (
          <Popover
            key={category}
            open={isOpen}
            onOpenChange={(open) => setOpenPopover(open ? category : null)}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-expanded={isOpen}
                className={cn(
                  "inline-flex h-5 items-center gap-1 rounded-4xl border px-2 py-0.5 text-xs font-medium transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
                  isActive
                    ? "border-lime bg-lime/10 text-lime"
                    : "border-hairline bg-transparent text-muted-foreground hover:bg-surface-2/50"
                )}
              >
                {label}
                {isActive && (
                  <span className="text-[10px]">· {active.length}</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48">
              <div className="flex flex-col gap-2">
                {values.map((value) => {
                  const checked = active.includes(value)
                  const id = `${category}-${value}`
                  return (
                    <div key={value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={id}
                        checked={checked}
                        onChange={() => onToggle(category, value)}
                        className="size-3.5 accent-lime"
                      />
                      <label
                        htmlFor={id}
                        className="cursor-pointer text-sm select-none"
                      >
                        {value}
                      </label>
                    </div>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        )
      })}
      {hasAnyActive && (
        <Button
          variant="ghost"
          size="xs"
          onClick={onClear}
          className="text-muted-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  )
}

export type { FilterCategory }
