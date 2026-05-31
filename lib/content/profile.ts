import { z } from "zod"

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
      href: z.string().url(),
    })
  ),
  principles: z.array(
    z.object({
      key: z.string().min(1),
      title: z.string().min(1),
      body: z.string().min(1),
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

const rawProfile: Profile = {
  name: "Hossam Marey",
  role: "Senior Front-End Developer",
  location: "Egypt",
  email: "",
  tagline:
    "I build fast, accessible interfaces for data-heavy products — then teach how it was done.",
  years: 8,
  socials: [{ label: "GitHub", href: "https://github.com/HossamMarey" }],
  principles: [],
  metrics: [],
}

export const profile: Profile = ProfileSchema.parse(rawProfile)
