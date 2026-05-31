"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { useShouldAnimate } from "@/hooks/use-should-animate"
import { cn } from "@/lib/utils"

import type { Project } from "@/lib/content/projects"

export function methodColor(method: Project["method"]): string {
  switch (method) {
    case "GET":
      return "bg-[var(--chart-2)]"
    case "POST":
    case "PUT":
      return "bg-[var(--chart-3)]"
    case "PATCH":
      return "bg-[var(--chart-5)]"
  }
}

export function statusColor(statusCode: Project["statusCode"]): string {
  switch (statusCode) {
    case 200:
      return "bg-[var(--status-ok)]"
    case 201:
      return "bg-[var(--status-warn)]"
    case 410:
      return "bg-[var(--status-err)]"
    default:
      return "bg-muted"
  }
}

interface NetworkWaterfallRowProps {
  project: Project
}

export function NetworkWaterfallRow({ project }: NetworkWaterfallRowProps) {
  const shouldAnimate = useShouldAnimate()

  return (
    <tr className="transition-colors hover:bg-surface-2/50">
      <td className="px-2 py-1.5">
        <Badge
          variant="outline"
          className={cn(
            "border-0 font-mono text-[10px] text-background",
            methodColor(project.method)
          )}
          aria-hidden="true"
        >
          {project.method}
        </Badge>
      </td>
      <td className="px-2 py-1.5">
        <Link
          href={`/work/${project.slug}`}
          className="truncate text-foreground hover:underline"
        >
          {project.name}
        </Link>
      </td>
      <td className="px-2 py-1.5 font-mono text-xs text-muted-foreground">
        {project.type}
      </td>
      <td className="px-2 py-1.5">
        <Badge
          variant="outline"
          className={cn(
            "border-0 font-mono text-[10px] text-background",
            statusColor(project.statusCode)
          )}
          aria-label={`Status: ${project.status}, ${project.statusCode}`}
        >
          {project.statusCode}
        </Badge>
      </td>
      <td className="px-2 py-1.5 font-mono text-xs text-muted-foreground">
        {project.size}
      </td>
      <td className="px-2 py-1.5 font-mono text-xs text-muted-foreground">
        {project.time}
      </td>
      <td className="px-2 py-1.5">
        <div className="relative h-2 w-full rounded-sm bg-surface-2/30">
          <motion.div
            className={cn(
              "absolute inset-y-0 start-0 h-full rounded-sm",
              methodColor(project.method)
            )}
            style={{ transformOrigin: "left" }}
            initial={
              shouldAnimate
                ? { scaleX: 0, x: `${project.startOffset * 100}%` }
                : {
                    scaleX: project.timeWeight,
                    x: `${project.startOffset * 100}%`,
                  }
            }
            animate={{
              scaleX: project.timeWeight,
              x: `${project.startOffset * 100}%`,
            }}
            transition={{
              duration: shouldAnimate ? 0.6 : 0.001,
              ease: "easeOut",
            }}
          />
        </div>
      </td>
    </tr>
  )
}

export function NetworkWaterfallCard({ project }: NetworkWaterfallRowProps) {
  const shouldAnimate = useShouldAnimate()

  return (
    <div className="border-b border-hairline py-3">
      <div className="mb-2 flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 border-0 font-mono text-[10px] text-background",
            methodColor(project.method)
          )}
          aria-hidden="true"
        >
          {project.method}
        </Badge>
        <Link
          href={`/work/${project.slug}`}
          className="flex-1 truncate text-sm text-foreground hover:underline"
        >
          {project.name}
        </Link>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 border-0 font-mono text-[10px] text-background",
            statusColor(project.statusCode)
          )}
          aria-label={`Status: ${project.status}, ${project.statusCode}`}
        >
          {project.statusCode}
        </Badge>
      </div>
      <div className="relative h-2 w-full rounded-sm bg-surface-2/30">
        <motion.div
          className={cn(
            "absolute inset-y-0 start-0 h-full rounded-sm",
            methodColor(project.method)
          )}
          style={{ transformOrigin: "left" }}
          initial={
            shouldAnimate
              ? { scaleX: 0, x: `${project.startOffset * 100}%` }
              : {
                  scaleX: project.timeWeight,
                  x: `${project.startOffset * 100}%`,
                }
          }
          animate={{
            scaleX: project.timeWeight,
            x: `${project.startOffset * 100}%`,
          }}
          transition={{
            duration: shouldAnimate ? 0.6 : 0.001,
            ease: "easeOut",
          }}
        />
      </div>
    </div>
  )
}
