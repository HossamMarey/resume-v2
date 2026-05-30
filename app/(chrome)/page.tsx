import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Elements — devtools://hossam",
}

export default function ElementsPage() {
  return (
    <section className="p-4">
      <h1 className="font-mono text-lg">Elements</h1>
      <p className="text-muted-foreground">Stub content for Elements panel.</p>
    </section>
  )
}
