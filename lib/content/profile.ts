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
  principles: [
    {
      key: "restraint-over-novelty",
      title: "Restraint over novelty",
      body: "The best interface is the one that never asks the user to learn something new. I resist adding motion, chrome, or abstraction until the problem genuinely demands it.",
    },
    {
      key: "precision-over-speed",
      title: "Precision over speed",
      body: "Fast code that is wrong is slower than correct code written once. Types, tests, and semantic markup are not overhead — they are the tools that let me move confidently at scale.",
    },
    {
      key: "accessibility-by-default",
      title: "Accessibility by default",
      body: "WCAG AA is a floor, not a ceiling. Keyboard navigation, screen-reader labels, and reduced-motion respect are built in from the first commit, not patched in later.",
    },
    {
      key: "systems-over-one-offs",
      title: "Systems over one-offs",
      body: "Every component is a precedent. I design for the next ten features, not the current ticket, so the codebase grows narrower, not wider, over time.",
    },
  ],
  metrics: [],
}

export const profile: Profile = ProfileSchema.parse(rawProfile)
