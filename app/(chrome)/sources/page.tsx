import type { Metadata } from "next"

import type { SourceTreeItem } from "@/components/file-tree"

import { SourcesPanel } from "@/components/sources-panel"

export const metadata: Metadata = {
  title: "Sources",
  description:
    "Sources panel — resume, articles, and talks from devtools://hossam.",
  alternates: { canonical: "/sources" },
  openGraph: {
    url: "/sources",
    title: "Sources — devtools://hossam",
    description:
      "Sources panel — resume, articles, and talks from devtools://hossam.",
  },
}

const sourcesTree: SourceTreeItem[] = [
  { id: "resume", label: "resume.pdf", type: "file" },
  { id: "contact", label: "contact.ts", type: "file" },
  { id: "articles", label: "articles/", type: "folder", comingSoon: true },
  { id: "talks", label: "talks/", type: "folder", comingSoon: true },
]

export default function SourcesPage() {
  return (
    <section className="flex h-full flex-col p-4">
      <h1 className="font-mono text-lg">Sources</h1>
      <SourcesPanel items={sourcesTree} />
    </section>
  )
}
