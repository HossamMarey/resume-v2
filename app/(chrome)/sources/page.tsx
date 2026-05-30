import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sources — devtools://hossam",
}

export default function SourcesPage() {
  return (
    <section className="p-4">
      <h1 className="font-mono text-lg">Sources</h1>
      <p className="text-muted-foreground">Stub content for Sources panel.</p>
    </section>
  )
}
