import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { hasPlaceholder } from "@/lib/content/has-placeholder"

import type { Project } from "@/lib/content/projects"

interface CaseStudyHeaderProps {
  project: Project
}

export function CaseStudyHeader({ project }: CaseStudyHeaderProps) {
  const isMock =
    hasPlaceholder(project) && process.env.NODE_ENV !== "production"

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs">
        <span className="flex items-center gap-2 text-status-ok">
          <span
            className="inline-block size-2 rounded-full bg-lime"
            aria-hidden="true"
          />
          200 OK
        </span>
        <span className="text-muted-foreground" aria-hidden="true">
          ·
        </span>
        <span className="text-muted-foreground">
          <span className="text-foreground">GET</span> /work/{project.slug}
        </span>
        {isMock && (
          <Badge
            variant="outline"
            className="border-lime/40 font-mono text-[10px] text-lime"
          >
            [MOCK]
          </Badge>
        )}
      </div>

      <nav
        aria-label="Breadcrumb"
        className="mt-3 text-sm text-muted-foreground"
      >
        <Link
          href="/work"
          className="hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
        >
          Network
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-foreground" aria-current="page">
          {project.name}
        </span>
      </nav>
    </div>
  )
}
