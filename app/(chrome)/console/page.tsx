import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Console — devtools://hossam",
}

export default function ConsolePage() {
  return (
    <section className="p-4">
      <h1 className="font-mono text-lg">Console</h1>
      <p className="text-muted-foreground">Stub content for Console panel.</p>
    </section>
  )
}
