import { z } from "zod"

import { experience } from "./experience"
import { projects } from "./projects"

function computeYearsShipped(): number {
  let earliest = ""
  for (const entry of experience) {
    for (const role of entry.roles) {
      if (!earliest || role.startDate < earliest) {
        earliest = role.startDate
      }
    }
  }
  if (!earliest) return 0

  const [year, month] = earliest.split("-").map(Number)
  const start = new Date(year, month - 1)
  const now = new Date()
  let years = now.getFullYear() - start.getFullYear()
  if (now.getMonth() < start.getMonth()) {
    years--
  }
  return Math.max(0, years)
}

const hrefSchema = z.string().refine(
  (v) => {
    try {
      new URL(v)
      return true
    } catch {
      return false
    }
  },
  { message: "invalid href" }
)

export const ProfileSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  location: z.string(),
  email: z.union([z.literal(""), z.string().email()]),
  tagline: z.string().min(1),
  years: z.number().int().min(0),
  socials: z.array(
    z.object({
      label: z.string().min(1),
      href: hrefSchema,
      icon: z.enum([
        "github",
        "linkedin",
        "behance",
        "youtube",
        "whatsapp",
        "email",
      ]),
    })
  ),
  personalInfo: z.array(
    z.object({
      label: z.string().min(1),
      value: z.string().min(1),
    })
  ),
  metrics: z.array(
    z.object({
      label: z.string().min(1),
      value: z.string().min(1),
      suffix: z.string().optional(),
    })
  ),
})

export type Profile = z.infer<typeof ProfileSchema>
export type Social = Profile["socials"][number]

const yearsShipped = computeYearsShipped()

const rawProfile: Profile = {
  name: "Hossam Marey",
  role: "Senior Front-End Developer",
  location: "Egypt",
  email: "",
  tagline: `Senior Frontend Engineer in scalable, security-focused products. Led monorepo architecture; expert in React, Next.js, and TypeScript with full-stack delivery and team leadership.`,
  years: yearsShipped,
  socials: [
    {
      label: "WhatsApp",
      href: "https://wa.me/201207721288",
      icon: "whatsapp",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/hossam-marey/",
      icon: "linkedin",
    },
    {
      label: "Behance",
      href: "https://behance.net/HossamMarey",
      icon: "behance",
    },
    {
      label: "GitHub",
      href: "https://github.com/HossamMarey",
      icon: "github",
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/codv-academy",
      icon: "youtube",
    },
    {
      label: "Email",
      href: "mailto:hosmarey@gmail.com",
      icon: "email",
    },
  ],
  personalInfo: [
    { label: "Nationality", value: "Egyptian" },
    { label: "DOB", value: "11/1992" },
    { label: "Address", value: "Mansoura (ready to relocate)" },
    { label: "Freelance", value: "Available" },
    { label: "Status", value: "Buguard (full time)" },
    { label: "Last Update", value: "June. 2026" },
  ],
  metrics: [
    { label: "Years shipped", value: String(yearsShipped), suffix: "+" },
    { label: "Projects shipped", value: String(projects.length) },
    { label: "Talks & articles", value: "3" },
    { label: "Mentees", value: "5" },
  ],
}

export const profile: Profile = ProfileSchema.parse(rawProfile)
