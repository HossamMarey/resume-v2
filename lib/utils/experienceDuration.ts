import { intervalToDuration } from "date-fns"

export function formatExperienceDuration(
  startDate: string,
  endDate: string | "present"
): string {
  const start = parseYearMonth(startDate)
  const end = endDate === "present" ? new Date() : parseYearMonth(endDate)

  // Add one month to make it inclusive like LinkedIn
  const adjustedEnd = new Date(end.getFullYear(), end.getMonth() + 1)

  const duration = intervalToDuration({ start, end: adjustedEnd })

  const years = duration.years ?? 0
  const months = duration.months ?? 0

  const parts: string[] = []

  if (years > 0) {
    parts.push(`${years} yr${years === 1 ? "" : "s"}`)
  }

  if (months > 0) {
    parts.push(`${months} mo${months === 1 ? "" : "s"}`)
  }

  if (parts.length === 0) {
    return "1 mo"
  }

  return parts.join(" ")
}

export function formatCompanyDuration(
  roles: Array<{ startDate: string; endDate: string | "present" }>
): string {
  let earliestStart = parseYearMonth(roles[0].startDate)
  let latestEnd: Date =
    roles[0].endDate === "present"
      ? new Date()
      : parseYearMonth(roles[0].endDate)

  for (let i = 1; i < roles.length; i++) {
    const start = parseYearMonth(roles[i].startDate)
    const end =
      roles[i].endDate === "present"
        ? new Date()
        : parseYearMonth(roles[i].endDate)

    if (start < earliestStart) {
      earliestStart = start
    }
    if (end > latestEnd) {
      latestEnd = end
    }
  }

  const adjustedEnd = new Date(
    latestEnd.getFullYear(),
    latestEnd.getMonth() + 1
  )
  const duration = intervalToDuration({
    start: earliestStart,
    end: adjustedEnd,
  })

  const years = duration.years ?? 0
  const months = duration.months ?? 0

  const parts: string[] = []

  if (years > 0) {
    parts.push(`${years} yr${years === 1 ? "" : "s"}`)
  }

  if (months > 0) {
    parts.push(`${months} mo${months === 1 ? "" : "s"}`)
  }

  if (parts.length === 0) {
    return "1 mo"
  }

  return parts.join(" ")
}

export function formatDateRange(
  startDate: string,
  endDate: string | "present"
): string {
  const start = formatYearMonth(startDate)
  const end = endDate === "present" ? "Present" : formatYearMonth(endDate)
  return `${start} – ${end}`
}

function parseYearMonth(value: string): Date {
  const [year, month] = value.split("-").map(Number)
  return new Date(year, month - 1)
}

function formatYearMonth(value: string): string {
  const [year, month] = value.split("-").map(Number)
  const date = new Date(year, month - 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}
