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
      className="mt-8 flex items-center justify-between border-t border-hairline pt-6"
    >
      <Link
        href={`/work/${prev.slug}`}
        aria-label={`Previous case study: ${prev.name}`}
        className="text-sm text-muted-foreground hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span aria-hidden="true" className="me-1">
          ←
        </span>
        {prev.name}
      </Link>

      <Link
        href={`/work/${next.slug}`}
        aria-label={`Next case study: ${next.name}`}
        className="text-sm text-muted-foreground hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
      >
        {next.name}
        <span aria-hidden="true" className="ms-1">
          →
        </span>
      </Link>
    </nav>
  )
}
