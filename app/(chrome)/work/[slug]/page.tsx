import dynamic from "next/dynamic"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { projects } from "@/lib/content/projects"

const warnedSlugs = new Set<string>()

const NetworkRequestDetail = dynamic(
  () =>
    import("@/components/network-request-detail").then(
      (m) => m.NetworkRequestDetail
    ),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-8 w-1/2 rounded bg-muted" />
        <div className="h-32 rounded bg-muted" />
      </div>
    ),
  }
)

export function generateStaticParams() {
  return projects.filter((p) => p.featured).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project || !project.featured) {
    return { title: "Project Detail — devtools://hossam" }
  }
  return {
    title: `${project.name} — devtools://hossam`,
  }
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)

  if (!project || !project.featured) {
    notFound()
  }

  if (
    project.meta.mock &&
    process.env.NODE_ENV !== "production" &&
    !warnedSlugs.has(project.slug)
  ) {
    warnedSlugs.add(project.slug)
    console.warn(
      `[MOCK] Case study "${project.slug}" contains placeholder content.`
    )
  }

  return (
    <section className="p-4">
      <NetworkRequestDetail project={project} />
    </section>
  )
}
