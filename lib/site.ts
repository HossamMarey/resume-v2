export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://hossammarey.com"

export const SITE_NAME = "devtools://hossam"

export const SITE_TITLE_DEFAULT =
  "devtools://hossam — Hossam Marey, Senior Front-End Developer"

export const SITE_DESCRIPTION_DEFAULT =
  "Portfolio of Hossam Marey — Senior Front-End Developer building fast, accessible interfaces for data-heavy products."

export const OG_LOCALE = "en_US"

export function siteUrl(path = "/"): string {
  const base = SITE_URL.replace(/\/$/, "")
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalizedPath}`
}

const FALLBACK_DESCRIPTION =
  "Senior Front-End Developer building fast, accessible interfaces for data-heavy products."

export function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/)
  const sentence = match ? match[0].trim() : text.trim()
  const result = clampLength(sentence, 160)
  return result || FALLBACK_DESCRIPTION
}

export function clampLength(text: string, max: number): string {
  if (text.length <= max) return text.trim()
  const truncated = text.slice(0, max)
  const lastSpace = truncated.lastIndexOf(" ")
  const result =
    lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated.slice(0, max)
  return result.trim()
}

export function titleForSegment(
  segment: string,
  template = " — devtools://hossam"
): string {
  const full = `${segment}${template}`
  if (full.length <= 60) return segment
  return clampLength(segment, 60 - template.length)
}

export function absoluteTitleForProject(name: string): string {
  const suffix = " — devtools://hossam"
  const full = `${name}${suffix}`
  if (full.length <= 60) return full
  return `${clampLength(name, 60 - suffix.length)}${suffix}`
}
