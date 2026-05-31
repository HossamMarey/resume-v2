import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { projects } from "@/lib/content/projects"

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  return {
    title: project
      ? `${project.name} — devtools://hossam`
      : "Project Detail — devtools://hossam",
  }
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)

  if (!project) {
    notFound()
  }

  return (
    <section className="p-4">
      <h1 className="font-mono text-lg">Case Study: {project.name}</h1>
      <p className="text-muted-foreground">
        Stub content for case study detail.
      </p>
    </section>
  )
}
