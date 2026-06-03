import dynamic from "next/dynamic"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CaseStudyHeader } from "@/components/case-study-header"
import { CaseStudyHero } from "@/components/case-study-hero"
import { CaseStudyPager } from "@/components/case-study-pager"
import { JsonLd } from "@/components/json-ld"
import { ProjectOpenXp } from "@/components/project-open-xp"
import { hasPlaceholder } from "@/lib/content/has-placeholder"
import { projects } from "@/lib/content/projects"
import { absoluteTitleForProject, firstSentence, siteUrl } from "@/lib/site"

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

const ProjectMediaGallery = dynamic(
  () =>
    import("@/components/project-media-gallery").then(
      (m) => m.ProjectMediaGallery
    ),
  {
    loading: () => (
      <div className="animate-pulse">
        <div className="aspect-video w-full rounded-sm bg-muted" />
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
    return {
      title: { absolute: "Project Detail — devtools://hossam" },
      description: "Project detail page — devtools://hossam.",
      alternates: { canonical: `/work/${slug}` },
      openGraph: {
        url: `/work/${slug}`,
        title: "Project Detail — devtools://hossam",
        description: "Project detail page — devtools://hossam.",
      },
    }
  }
  const title = absoluteTitleForProject(project.name)
  const description = firstSentence(project.problem || project.description)
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/work/${slug}` },
    openGraph: {
      type: "article",
      url: `/work/${slug}`,
      title,
      description,
    },
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
    hasPlaceholder(project) &&
    process.env.NODE_ENV !== "production" &&
    !warnedSlugs.has(project.slug)
  ) {
    warnedSlugs.add(project.slug)
    console.warn(
      `[MOCK] Case study "${project.slug}" contains placeholder content.`
    )
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Network",
        item: siteUrl("/work"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: project.name,
        item: siteUrl(`/work/${project.slug}`),
      },
    ],
  }

  return (
    <section className="container mx-auto p-4">
      <JsonLd data={breadcrumbJsonLd} />
      <ProjectOpenXp slug={project.slug} />
      <CaseStudyHeader project={project} />
      <CaseStudyHero project={project} image={project.images[0]} />
      <NetworkRequestDetail project={project} />
      {(project.images.length > 1 || project.videos.length > 0) && (
        <div className="mt-10">
          <ProjectMediaGallery
            images={project.images.slice(1)}
            videos={project.videos}
            projectName={project.name}
          />
        </div>
      )}
      <CaseStudyPager slug={project.slug} />
    </section>
  )
}
