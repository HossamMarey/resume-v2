import dynamic from "next/dynamic"
import type { Metadata } from "next"

const ConsoleREPL = dynamic(
  () => import("@/components/console-repl").then((m) => m.ConsoleREPL),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-8 w-1/2 rounded bg-muted" />
        <div className="h-32 rounded bg-muted" />
      </div>
    ),
  }
)

export const metadata: Metadata = {
  title: "Console",
  description:
    "Console panel — interactive REPL and command shell for devtools://hossam.",
  alternates: { canonical: "/console" },
  openGraph: {
    url: "/console",
    title: "Console — devtools://hossam",
    description:
      "Console panel — interactive REPL and command shell for devtools://hossam.",
  },
}

export default function ConsolePage() {
  return (
    <section className="flex h-full flex-col gap-3 p-4">
      <h1 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
        Console
      </h1>
      <ConsoleREPL />
    </section>
  )
}
