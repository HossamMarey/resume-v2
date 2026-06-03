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

function SectionHeader({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-3">
      <span className="font-mono text-2xl text-lime tabular-nums">{index}</span>
      <h2 className="font-mono text-sm tracking-wider text-muted-foreground uppercase">
        {label}
      </h2>
    </div>
  )
}

export function NetworkRequestDetail({ project }: NetworkRequestDetailProps) {
  const links = projectLinkList(project.links)

  return (
    <article className="space-y-10 border-t border-hairline pt-10">
      <section>
        <SectionHeader index="01" label="Problem" />
        {project.problem ? (
          <p className="max-w-prose text-sm leading-relaxed text-foreground">
            {project.problem}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No problem description provided.
          </p>
        )}
      </section>

      <section>
        <SectionHeader index="02" label="Role" />
        {project.role ? (
          <p className="max-w-prose text-sm leading-relaxed text-foreground">
            {project.role}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No role description provided.
          </p>
        )}
      </section>

      <section>
        <SectionHeader index="03" label="Stack" />
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

      <section>
        <SectionHeader index="04" label="Decisions" />
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

      <section>
        <SectionHeader index="05" label="Outcomes" />
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

      <section>
        <SectionHeader index="06" label="Links" />
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
