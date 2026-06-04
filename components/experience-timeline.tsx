import { experience } from "@/lib/content/experience"
import { ExperienceCompany } from "@/components/experience-company"

function earliestStart(roles: { startDate: string }[]): string {
  return roles.reduce(
    (earliest, role) => (role.startDate < earliest ? role.startDate : earliest),
    roles[0]?.startDate ?? ""
  )
}

function sortByDateDesc(entries: typeof experience) {
  return [...entries].sort((a, b) => {
    const aStart = earliestStart(a.roles)
    const bStart = earliestStart(b.roles)
    return bStart.localeCompare(aStart)
  })
}

export function ExperienceTimeline() {
  const fulltime = sortByDateDesc(
    experience.filter((e) => e.category === "fulltime")
  )
  const freelance = sortByDateDesc(
    experience.filter((e) => e.category === "freelance")
  )

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {fulltime.length > 0 && (
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
      )}

      {freelance.length > 0 && (
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
      )}
    </div>
  )
}
