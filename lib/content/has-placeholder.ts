import type { Project } from "./projects"

const PLACEHOLDER_MARKERS = ["[PLACEHOLDER", "[MOCK]"]

export function hasPlaceholder(project: Project | null | undefined): boolean {
  if (!project) return false
  const fields: string[] = [
    project.description ?? "",
    project.problem ?? "",
    project.role ?? "",
    ...(project.decisions ?? []),
    ...(project.outcomes ?? []),
  ]
  return fields.some((text) =>
    PLACEHOLDER_MARKERS.some((marker) => text.includes(marker))
  )
}
