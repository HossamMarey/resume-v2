import type { MetadataRoute } from "next"

import { projects } from "@/lib/content/projects"
import { siteUrl } from "@/lib/site"

const staticRoutes = [
  "/",
  "/work",
  "/perf",
  "/sources",
  "/console",
  "/recruiter",
  "/experience",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = staticRoutes.map((path) => ({ url: siteUrl(path) }))

  const featuredEntries = projects
    .filter((p) => p.featured)
    .map((p) => ({ url: siteUrl(`/work/${p.slug}`) }))

  return [...staticEntries, ...featuredEntries]
}
