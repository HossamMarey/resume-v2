"use client"

import {
  BookOpen,
  Code,
  ExternalLink,
  FolderGit,
  Palette,
  MoveRight,
} from "lucide-react"
import Link from "next/link"

import { useImageTrailHandlers } from "@/components/network-image-trail"
import { Badge } from "@/components/ui/badge"
import { projectLinkList } from "@/lib/content/projects"
import { cn } from "@/lib/utils"

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

interface NetworkWaterfallRowProps {
  project: Project
}

function ProjectNameLink({
  project,
  className,
}: NetworkWaterfallRowProps & { className?: string }) {
  const base = cn(
    "flex items-center gap-1 truncate text-foreground hover:underline",
    className
  )

  return (
    <Link
      href={`/work/${project.slug}`}
      className={base}
      aria-label={`${project.name} (opens in new tab)`}
    >
      {project.name} <MoveRight className="size-4 opacity-50" />
    </Link>
  )

  // const links = projectLinkList(project.links)
  // const previewLink = links.find((l) => l.kind === "preview")
  // const href = previewLink?.href || links[0]?.href
  // if (href) {
  //   return (
  //     <a href={href} target="_blank" rel="noopener noreferrer" className={base}>
  //       {project.name}
  //       <span className="sr-only"> (opens in new tab)</span>
  //     </a>
  //   )
  // }

  // return (
  //   <span className={cn("truncate text-foreground", className)}>
  //     {project.name}
  //   </span>
  // )
}

export function NetworkWaterfallRow({ project }: NetworkWaterfallRowProps) {
  const links = projectLinkList(project.links)
  const visibleStack = project.stack.slice(0, 3)
  const extraStack = project.stack.length - visibleStack.length

  const trail = useImageTrailHandlers()
  const trailProps =
    trail && project.images.length > 0
      ? {
          onMouseEnter: () => trail.onRowEnter(project.images),
          onMouseMove: (e: React.MouseEvent) =>
            trail.onRowMove(project.images, e),
          onMouseLeave: () => trail.onRowLeave(),
        }
      : {}

  return (
    <tr className="transition-colors hover:bg-surface-2/50" {...trailProps}>
      <td className="px-2 py-1.5">
        <ProjectNameLink project={project} />
      </td>
      <td className="px-2 py-1.5 font-mono text-xs text-muted-foreground">
        {project.type}
      </td>
      <td className="px-2 py-1.5">
        <div className="flex flex-wrap gap-1">
          {visibleStack.map((tech) => (
            <Badge
              key={tech}
              variant="outline"
              className="font-mono text-[10px]"
            >
              {tech}
            </Badge>
          ))}
          {extraStack > 0 && (
            <Badge variant="outline" className="font-mono text-[10px]">
              +{extraStack}
            </Badge>
          )}
        </div>
      </td>
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-2">
          {links.map((link) => {
            const Icon = LINK_ICONS[link.kind]
            return (
              <a
                key={link.kind}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${link.label} (opens in new tab)`}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              >
                {Icon ? <Icon className="size-4" /> : link.label}
              </a>
            )
          })}
        </div>
      </td>
    </tr>
  )
}

export function NetworkWaterfallCard({ project }: NetworkWaterfallRowProps) {
  const links = projectLinkList(project.links)
  const visibleStack = project.stack.slice(0, 3)
  const extraStack = project.stack.length - visibleStack.length

  return (
    <div className="border-b border-hairline py-3">
      <div className="mb-2 flex items-center gap-2">
        <ProjectNameLink project={project} className="flex-1 text-sm" />
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {project.type}
        </span>
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        {visibleStack.map((tech) => (
          <Badge key={tech} variant="outline" className="font-mono text-[10px]">
            {tech}
          </Badge>
        ))}
        {extraStack > 0 && (
          <Badge variant="outline" className="font-mono text-[10px]">
            +{extraStack}
          </Badge>
        )}
      </div>
      {links.length > 0 && (
        <div className="flex items-center gap-3">
          {links.map((link) => (
            <a
              key={link.kind}
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
      )}
    </div>
  )
}
