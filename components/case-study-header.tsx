"use client"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"

import type { Project } from "@/lib/content/projects"

interface CaseStudyHeaderProps {
  project: Project
}

export function CaseStudyHeader({ project }: CaseStudyHeaderProps) {
  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-sm text-muted-foreground"
      >
        <Link href="/work" className="hover:text-foreground">
          Network
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-foreground" aria-current="page">
          {project.name}
        </span>
      </nav>

      <div className="mb-6 flex items-center gap-3">
        <h1 className="font-mono text-xl text-foreground">{project.name}</h1>
        {project.meta.mock && process.env.NODE_ENV !== "production" && (
          <Badge
            variant="outline"
            className="border-lime/40 font-mono text-[10px] text-lime"
          >
            [MOCK]
          </Badge>
        )}
      </div>
    </>
  )
}
