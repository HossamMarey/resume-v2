import type { Metadata } from "next"

import { PageWeightBudget } from "@/components/page-weight-budget"
import { ScoreRing } from "@/components/score-ring"
import { pageWeightBudget } from "@/lib/content/page-weight"
import { profile } from "@/lib/content/profile"

export const metadata: Metadata = {
  title: "Performance",
  description:
    "Performance panel — Lighthouse metrics and page-weight budget for devtools://hossam.",
  alternates: { canonical: "/perf" },
  openGraph: {
    url: "/perf",
    title: "Performance — devtools://hossam",
    description:
      "Performance panel — Lighthouse metrics and page-weight budget for devtools://hossam.",
  },
}

export default function PerformancePage() {
  return (
    <section className="space-y-10 p-4">
      <h1 className="font-mono text-lg">Performance</h1>

      {profile.metrics.length > 0 && (
        <div>
          <h2 className="mb-6 font-mono text-sm tracking-wider text-muted-foreground uppercase">
            Metrics
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {profile.metrics.map((m, i) => (
              <ScoreRing
                key={m.label}
                label={m.label}
                value={m.value}
                suffix={m.suffix}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-6 font-mono text-sm tracking-wider text-muted-foreground uppercase">
          Page Weight Budget
        </h2>
        <PageWeightBudget items={pageWeightBudget} budgetBytes={500_000} />
      </div>
    </section>
  )
}
