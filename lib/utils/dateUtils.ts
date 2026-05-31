import { format, parseISO } from "date-fns"

export function toISOString(date: Date): string {
  return date.toISOString()
}

export function fromISOString(iso: string): Date {
  return parseISO(iso)
}

export function formatDate(date: Date, pattern = "MMM d, yyyy"): string {
  return format(date, pattern)
}
