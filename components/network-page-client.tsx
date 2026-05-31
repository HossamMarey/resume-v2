"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useCallback } from "react"

import { Button } from "@/components/ui/button"
import { NetworkFilterBar } from "@/components/network-filter-bar"
import { NetworkWaterfallTable } from "@/components/network-waterfall-table"

import type {
  ActiveFilters,
  AvailableFilters,
  FilterCategory,
} from "@/components/network-filter-bar"
import type { Project } from "@/lib/content/projects"

interface NetworkPageClientProps {
  projects: readonly Project[]
}

function deriveAvailableFilters(
  projects: readonly Project[]
): AvailableFilters {
  const methods = new Set<string>()
  const statuses = new Set<string>()
  const years = new Set<string>()

  for (const p of projects) {
    methods.add(p.method)
    statuses.add(p.status)
    years.add(String(p.year))
  }

  return {
    method: Array.from(methods).sort(),
    status: Array.from(statuses).sort(),
    year: Array.from(years).sort((a, b) => Number(b) - Number(a)),
  }
}

function parseActiveFilters(searchParams: URLSearchParams): ActiveFilters {
  return {
    method: searchParams.getAll("method"),
    status: searchParams.getAll("status"),
    year: searchParams.getAll("year"),
  }
}

function applyFilters(
  projects: readonly Project[],
  filters: ActiveFilters
): Project[] {
  return projects.filter((p) => {
    const methodMatch =
      filters.method.length === 0 || filters.method.includes(p.method)
    const statusMatch =
      filters.status.length === 0 || filters.status.includes(p.status)
    const yearMatch =
      filters.year.length === 0 || filters.year.includes(String(p.year))
    return methodMatch && statusMatch && yearMatch
  })
}

export function NetworkPageClient({ projects }: NetworkPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const availableFilters = useMemo(
    () => deriveAvailableFilters(projects),
    [projects]
  )

  const activeFilters = useMemo(
    () => parseActiveFilters(searchParams),
    [searchParams]
  )

  const filtered = useMemo(
    () => applyFilters(projects, activeFilters),
    [projects, activeFilters]
  )

  const handleToggle = useCallback(
    (category: FilterCategory, value: string) => {
      const params = new URLSearchParams()
      const current = activeFilters[category]
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]

      for (const cat of ["method", "status", "year"] as const) {
        const values = cat === category ? next : activeFilters[cat]
        for (const v of values) {
          params.append(cat, v)
        }
      }

      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [activeFilters, router, pathname]
  )

  const handleClear = useCallback(() => {
    router.replace(pathname)
  }, [router, pathname])

  return (
    <div className="flex flex-col gap-3">
      <NetworkFilterBar
        availableFilters={availableFilters}
        activeFilters={activeFilters}
        onToggle={handleToggle}
        onClear={handleClear}
      />
      {filtered.length > 0 ? (
        <NetworkWaterfallTable projects={filtered} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <p className="font-mono text-sm text-muted-foreground">
            No requests match your filter
          </p>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
