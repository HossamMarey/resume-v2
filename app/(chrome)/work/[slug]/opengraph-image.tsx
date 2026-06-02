import { ImageResponse } from "next/og"

import { projects } from "@/lib/content/projects"
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Case study — devtools://hossam"

export function generateStaticParams() {
  return projects.filter((p) => p.featured).map((p) => ({ slug: p.slug }))
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)

  const title = project?.name ?? "devtools://hossam"
  const subtitle = project ? "devtools://hossam" : undefined

  return new ImageResponse(
    renderOgImage({
      title,
      subtitle,
    }),
    { ...OG_SIZE }
  )
}
