import {
  ComputedStylesCell,
  ComputedStylesPanel,
} from "@/components/computed-styles-panel"
import { Badge } from "@/components/ui/badge"

import type { Project } from "@/lib/content/projects"

interface NetworkRequestDetailProps {
  project: Project
}

export function NetworkRequestDetail({ project }: NetworkRequestDetailProps) {
  const presentLinks = project.links.filter(
    (l) => typeof l.href === "string" && l.href.length > 0
  )

  return (
    <article>
      <section className="mb-8">
        <h2 className="mb-2 font-mono text-sm tracking-wider text-muted-foreground uppercase">
          Problem
        </h2>
        {project.problem ? (
          <p className="text-sm leading-relaxed text-foreground">
            {project.problem}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No problem description provided.
          </p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-mono text-sm tracking-wider text-muted-foreground uppercase">
          Role
        </h2>
        {project.role ? (
          <p className="text-sm leading-relaxed text-foreground">
            {project.role}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No role description provided.
          </p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-mono text-sm tracking-wider text-muted-foreground uppercase">
          Stack
        </h2>
        <div className="flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <Badge key={tech} variant="outline" className="font-mono text-xs">
              {tech}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-mono text-sm tracking-wider text-muted-foreground uppercase">
          Decisions
        </h2>
        {project.decisions.length > 0 ? (
          <ComputedStylesPanel>
            {project.decisions.map((decision, i) => (
              <ComputedStylesCell key={i}>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {decision}
                </p>
              </ComputedStylesCell>
            ))}
          </ComputedStylesPanel>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No decisions recorded.
          </p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-mono text-sm tracking-wider text-muted-foreground uppercase">
          Outcomes
        </h2>
        {project.outcomes.length > 0 ? (
          <ComputedStylesPanel>
            {project.outcomes.map((outcome, i) => (
              <ComputedStylesCell key={i}>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {outcome}
                </p>
              </ComputedStylesCell>
            ))}
          </ComputedStylesPanel>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No outcomes recorded.
          </p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-mono text-sm tracking-wider text-muted-foreground uppercase">
          Links
        </h2>
        {presentLinks.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {presentLinks.map((link, i) => (
              <a
                key={`${link.label}-${i}`}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-lime underline decoration-lime/40 underline-offset-4 hover:decoration-lime"
              >
                {link.label}
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No links provided.
          </p>
        )}
      </section>
    </article>
  )
}
