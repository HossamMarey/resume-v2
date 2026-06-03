import {
  ComputedStylesCell,
  ComputedStylesPanel,
} from "@/components/computed-styles-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { projectLinkList } from "@/lib/content/projects"
import { BookOpen, Code, ExternalLink, FolderGit, Palette } from "lucide-react"

import type { Project } from "@/lib/content/projects"

const LINK_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  preview: ExternalLink,
  code: Code,
  design: Palette,
  repo: FolderGit,
  docs: BookOpen,
}

interface NetworkRequestDetailProps {
  project: Project
}

export function NetworkRequestDetail({ project }: NetworkRequestDetailProps) {
  const links = projectLinkList(project.links)

  return (
    <article>
      {project.description && (
        <section className="mb-8">
          <p className="text-sm leading-relaxed text-foreground">
            {project.description}
          </p>
        </section>
      )}

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
        {project.stack.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <Badge key={tech} variant="outline" className="font-mono text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No stack listed.
          </p>
        )}
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
        {links.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {links.map((link) => {
              const Icon = LINK_ICONS[link.kind]
              return (
                <Button key={link.kind} asChild variant="outline" size="sm">
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {Icon && <Icon className="me-1 size-4" />}
                    {link.label}
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                </Button>
              )
            })}
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
