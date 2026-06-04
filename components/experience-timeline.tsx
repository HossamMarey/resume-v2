import { experience } from "@/lib/content/experience"
import { ExperienceCompany } from "@/components/experience-company"

export function ExperienceTimeline() {
  const fulltime = experience.filter((e) => e.category === "fulltime")
  const freelance = experience.filter((e) => e.category === "freelance")

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section>
        <h2 className="mb-4 font-mono text-sm tracking-wider text-muted-foreground uppercase">
          Full-time
        </h2>
        <div className="flex flex-col gap-4">
          {fulltime.map((entry) => (
            <ExperienceCompany key={entry.slug} entry={entry} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-mono text-sm tracking-wider text-muted-foreground uppercase">
          Freelance
        </h2>
        <div className="flex flex-col gap-4">
          {freelance.map((entry) => (
            <ExperienceCompany key={entry.slug} entry={entry} />
          ))}
        </div>
      </section>
    </div>
  )
}
