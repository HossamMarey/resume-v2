import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { experience, profile, projects, skillGroups } from "@/lib/content"
import {
  formatCompanyDuration,
  formatDateRange,
  formatExperienceDuration,
} from "@/lib/utils/experienceDuration"

export function RecruiterResume() {
  const featuredProjects = projects.filter((p) => p.featured)
  const highlightMetrics = profile.metrics.slice(0, 3)

  return (
    <article className="flex flex-col gap-16">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <h1 className="font-title text-4xl font-semibold tracking-tight text-foreground">
          {profile.name}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {profile.tagline}
        </p>
        {highlightMetrics.length > 0 && (
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {highlightMetrics.map((m) => (
              <li key={m.label} className="text-sm font-medium text-foreground">
                {m.value}
                {m.suffix ?? ""} {m.label}
              </li>
            ))}
          </ul>
        )}
      </header>

      {/* Featured case studies */}
      <section className="flex flex-col gap-6">
        <h2 className="font-title text-2xl font-semibold tracking-tight text-foreground">
          Featured work
        </h2>
        <div className="flex flex-col gap-4">
          {featuredProjects.map((project) => (
            <Card key={project.slug}>
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription className="flex flex-wrap gap-2">
                  {project.org && (
                    <Badge variant="outline">{project.org}</Badge>
                  )}
                  <Badge variant="outline">{project.type}</Badge>
                  {project.stack.slice(0, 3).map((tech) => (
                    <Badge key={tech} variant="outline">
                      {tech}
                    </Badge>
                  ))}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {project.outcomes.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {project.outcomes.map((outcome, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        {outcome}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="flex flex-col gap-6">
        <h2 className="font-title text-2xl font-semibold tracking-tight text-foreground">
          Experience
        </h2>
        <div className="flex flex-col gap-8">
          {(
            [
              { key: "fulltime", label: "Full-time" },
              { key: "freelance", label: "Freelance" },
            ] as const
          ).map(({ key, label }) => {
            const items = experience.filter((e) => e.category === key)
            if (items.length === 0) return null
            return (
              <div key={key} className="flex flex-col gap-4">
                <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                  {label}
                </h3>
                <div className="flex flex-col gap-6">
                  {items.map((entry) => (
                    <div key={entry.slug} className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground">
                          {entry.company}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {entry.type}
                          {" · "}
                          {formatCompanyDuration(entry.roles)}
                          {entry.location && entry.locationType
                            ? ` · ${entry.location} · ${entry.locationType}`
                            : entry.location
                              ? ` · ${entry.location}`
                              : entry.locationType
                                ? ` · ${entry.locationType}`
                                : ""}
                        </span>
                      </div>
                      <ul className="flex flex-col gap-1">
                        {entry.roles.map((role) => (
                          <li
                            key={role.name}
                            className="text-sm text-foreground"
                          >
                            {role.name}
                            {" · "}
                            {formatDateRange(role.startDate, role.endDate)}
                            {" · "}
                            {formatExperienceDuration(
                              role.startDate,
                              role.endDate
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Skills matrix */}
      <section className="flex flex-col gap-6">
        <h2 className="font-title text-2xl font-semibold tracking-tight text-foreground">
          Skills
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {skillGroups.map((group) => (
            <div key={group.name} className="flex flex-col gap-3">
              <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                {group.name}
              </h3>
              <ul className="flex flex-col gap-1">
                {group.skills.map((skill) => (
                  <li key={skill.name} className="text-sm text-foreground">
                    {skill.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Download CTA */}
      <section className="flex flex-col items-start gap-4 print:hidden">
        <Button asChild>
          <a href="/hossam-marey-resume.pdf" download>
            Download Resume
          </a>
        </Button>
      </section>

      {/* Contact links */}
      <footer className="flex flex-wrap gap-4">
        {profile.email !== "" && (
          <a
            href={`mailto:${profile.email}`}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-1 focus-visible:ring-ring"
          >
            {profile.email}
          </a>
        )}
        {profile.socials.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-1 focus-visible:ring-ring"
          >
            {link.label}
          </a>
        ))}
      </footer>
    </article>
  )
}
