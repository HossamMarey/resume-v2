import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { profile, projects, skillGroups } from "@/lib/content"

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
                  <Badge variant="outline">{project.method}</Badge>
                  <Badge variant="outline">{project.status}</Badge>
                  <Badge variant="outline">{project.year}</Badge>
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
