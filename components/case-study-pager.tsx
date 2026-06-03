import Link from "next/link"

import { projects } from "@/lib/content/projects"

interface CaseStudyPagerProps {
  slug: string
}

export function CaseStudyPager({ slug }: CaseStudyPagerProps) {
  const featured = projects.filter((p) => p.featured)

  if (featured.length < 2) {
    return null
  }

  const index = featured.findIndex((p) => p.slug === slug)
  if (index === -1) {
    return null
  }

  const n = featured.length
  const prev = featured[(index - 1 + n) % n]
  const next = featured[(index + 1) % n]

  return (
    <nav
      aria-label="Case study pager"
      className="mt-12 grid grid-cols-2 gap-4 border-t border-hairline pt-6"
    >
      <Link
        href={`/work/${prev.slug}`}
        aria-label={`Previous case study: ${prev.name}`}
        className="group flex flex-col gap-1 focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
          <span aria-hidden="true" className="me-1">
            ←
          </span>
          Prev
        </span>
        <span className="font-title text-lg text-foreground transition-colors group-hover:text-lime">
          {prev.name}
        </span>
      </Link>

      <Link
        href={`/work/${next.slug}`}
        aria-label={`Next case study: ${next.name}`}
        className="group flex flex-col items-end gap-1 text-end focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
          Next
          <span aria-hidden="true" className="ms-1">
            →
          </span>
        </span>
        <span className="font-title text-lg text-foreground transition-colors group-hover:text-lime">
          {next.name}
        </span>
      </Link>
    </nav>
  )
}
