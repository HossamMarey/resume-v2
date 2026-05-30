import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Network — devtools://hossam",
}

export default function NetworkPage() {
  return (
    <section className="p-4">
      <h1 className="font-mono text-lg">Network</h1>
      <p className="text-muted-foreground">Stub content for Network panel.</p>
    </section>
  )
}
