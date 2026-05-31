import type { Metadata } from "next"

import { projects } from "@/lib/content/projects"
import { NetworkWaterfallTable } from "@/components/network-waterfall-table"

export const metadata: Metadata = {
  title: "Network — devtools://hossam",
}

export default function NetworkPage() {
  return (
    <section className="p-4">
      <h1 className="font-mono text-lg">Network</h1>
      <NetworkWaterfallTable projects={projects} />
    </section>
  )
}
