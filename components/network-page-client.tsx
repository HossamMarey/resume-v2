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
import type { ImageTrailVariant } from "@/components/network-image-trail"
import type { Project } from "@/lib/content/projects"

const NETWORK_TRAIL_VARIANT: ImageTrailVariant = 1

interface NetworkPageClientProps {
  projects: readonly Project[]
}

function deriveAvailableFilters(
  projects: readonly Project[]
): AvailableFilters {
  const types = new Set<string>()
  const stacks = new Set<string>()
  const orgs = new Set<string>()

  for (const p of projects) {
    if (p.type) types.add(p.type)
    for (const s of p.stack) {
      stacks.add(s)
    }
    if (p.org) orgs.add(p.org)
  }

  return {
    type: Array.from(types).sort(),
    stack: Array.from(stacks).sort(),
    org: Array.from(orgs).sort(),
  }
}

function parseActiveFilters(searchParams: URLSearchParams): ActiveFilters {
  return {
    type: searchParams.getAll("type").filter(Boolean),
    stack: searchParams.getAll("stack").filter(Boolean),
    org: searchParams.getAll("org").filter(Boolean),
  }
}

function applyFilters(
  projects: readonly Project[],
  filters: ActiveFilters
): Project[] {
  return projects.filter((p) => {
    const typeMatch = filters.type.length === 0 || filters.type.includes(p.type)
    const stackMatch =
      filters.stack.length === 0 ||
      filters.stack.some((s) => p.stack.includes(s))
    const orgMatch = filters.org.length === 0 || filters.org.includes(p.org)
    return typeMatch && stackMatch && orgMatch
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
      const params = new URLSearchParams(searchParams.toString())
      const current = activeFilters[category]
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]

      params.delete(category)
      for (const v of next) {
        if (v) params.append(category, v)
      }

      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [activeFilters, router, pathname, searchParams]
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
        <NetworkWaterfallTable
          projects={filtered}
          variant={NETWORK_TRAIL_VARIANT}
        />
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
