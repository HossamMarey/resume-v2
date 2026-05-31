import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Performance — devtools://hossam",
}

export default function PerformancePage() {
  return (
    <section className="p-4">
      <h1 className="font-mono text-lg">Performance</h1>
      <p className="text-muted-foreground">
        Stub content for Performance panel.
      </p>
    </section>
  )
}
