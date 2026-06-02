import type { Metadata } from "next"
import { Suspense } from "react"

import { projects } from "@/lib/content/projects"
import { NetworkPageClient } from "@/components/network-page-client"

export const metadata: Metadata = {
  title: "Network",
  description:
    "Network panel — case studies and project waterfall for devtools://hossam.",
  alternates: { canonical: "/work" },
  openGraph: {
    url: "/work",
    title: "Network — devtools://hossam",
    description:
      "Network panel — case studies and project waterfall for devtools://hossam.",
  },
}

export default function NetworkPage() {
  return (
    <section className="p-4">
      <h1 className="font-mono text-lg">Network</h1>
      <Suspense fallback={null}>
        <NetworkPageClient projects={projects} />
      </Suspense>
    </section>
  )
}
