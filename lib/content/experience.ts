import { z } from "zod"

export const ExperienceKind = z.enum(["fulltime", "freelance", "side"])
export const ExperienceMode = z.enum(["remote", "hybrid", "onsite", "unknown"])

export const HighlightSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().optional(),
  skills: z.array(z.string().min(1)),
  roles: z.array(z.string().min(1)),
})

export type Highlight = z.infer<typeof HighlightSchema>

export const ExperienceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  role: z.string().min(1),
  company: z.string().min(1),
  companyLogo: z.string().optional(),
  kind: ExperienceKind,
  mode: ExperienceMode.default("unknown"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  summary: z.string().optional(),
  highlights: z.array(HighlightSchema),
})

export type Experience = z.infer<typeof ExperienceSchema>

const ExperienceCollectionSchema = z
  .array(ExperienceSchema)
  .superRefine((items, ctx) => {
    const seen = new Map<string, number>()
    items.forEach((item, idx) => {
      const prev = seen.get(item.slug)
      if (prev !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [idx, "slug"],
          message: `Duplicate slug "${item.slug}" (also at index ${prev})`,
        })
      }
      seen.set(item.slug, idx)
    })
  })

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function parseCompany(raw: string): string {
  return raw.split(/\s+-\s+/)[0].trim()
}

function parseMode(raw: string | undefined): Experience["mode"] {
  if (!raw) return "unknown"
  if (/remotely|remote/i.test(raw)) return "remote"
  if (/hybrid/i.test(raw)) return "hybrid"
  if (/onsite|on-site/i.test(raw)) return "onsite"
  return "unknown"
}

function parseDateRange(raw: string): {
  startDate: string
  endDate: string
} {
  const cleaned = raw
    .replace(/^(Full-Time|Full Time|Part-Time|Part Time):\s*/i, "")
    .trim()
  const parts = cleaned.split(/\s*-\s*/)
  if (parts.length === 2) {
    const [start, end] = parts.map((p) => p.trim())
    return { startDate: start, endDate: end }
  }
  return { startDate: cleaned, endDate: "present" }
}

type LegacyHighlight = {
  title: string
  description?: string
  date?: string
  skills: string[]
  roles: string[]
}

type LegacyEmployment = {
  role: string
  company: string
  date: string
  img?: string
  projects: LegacyHighlight[]
}

type LegacySide = {
  name: string
  date: string
  img?: string
  projects: LegacyHighlight[]
}

const legacyFulltime: LegacyEmployment[] = [
  {
    role: "Senior Front-End Developer",
    company: "Buguard - Remotely - Full-time",
    date: "Jun. 2023 - present",
    img: "/images/companies/buguard.png",
    projects: [
      {
        title: "Buguard Dashboards",
        description:
          "Dark Atlas is a proactive dark web monitoring platform that helps businesses prevent data breaches",
        date: "Dec. 2022 - Present",
        skills: [
          "React.js",
          "Next.js",
          "Ant.Design",
          "TailwindCss",
          "React-query",
          "TS",
        ],
        roles: [
          "Developed a comprehensive dashboard enabling security leak monitoring and report export for multiple companies.",
        ],
      },
      {
        title: "Buguard and DarkAtlas Landing Pages",
        description:
          "Buguard, LLC is a multinational cybersecurity firm offering various services to companies worldwide, including penetration testing, GRC services, and managed security services. They operate in North America, Europe, the Middle East and Africa",
        date: "Dec. 2022 - Present",
        skills: [
          "React.js",
          "Next.js",
          "Ant.Design",
          "TailwindCss",
          "React-query",
          "TS",
        ],
        roles: [
          "Created optimized landing pages to enhance SEO performance and support marketing efforts for Buguard and DarkAtlas.",
        ],
      },
    ],
  },
  {
    role: "Senior Front-End Developer",
    company: "MasheedGate - Hybrid - Full-time",
    date: "Nov. 2022 - Jul. 2023",
    img: "/images/companies/masheed.png",
    projects: [
      {
        title: "E-commerce Website Development",
        description:
          "We are building a new Ecommerce website for selling construction materials",
        date: "Dec. 2022 - Present",
        skills: [
          "React.js",
          "Remix.js",
          "Ant.Design",
          "TailwindCss",
          "React-query",
          "GraphQL",
          "TS",
        ],
        roles: [
          "development of a cutting-edge e-commerce platform dedicated to selling construction materials.",
          "Implemented Domain-Driven Design (DDD) principles and adopted Monorepos to enhance maintenance and streamline development processes",
        ],
      },
    ],
  },
  {
    role: "Front-End Developer (NuxtJs , NextJS)",
    company: "Inovola - Remotely",
    date: "Full-Time: Apr. 2021 - sep. 2022",
    img: "/images/companies/inovola.jpg",
    projects: [
      {
        title: "BuilderZ Project",
        description:
          "E-learning and management system for selling online courses.",
        date: "Aug. 2021 - Present",
        skills: ["Vue.js", "Nuxt,js", "Ant.Design", "TailwindCss"],
        roles: [
          "Leading to the development of an E-learning and management system for selling online courses.",
        ],
      },
      {
        title: "Zrealtors",
        date: "Nov. 2021 - Present",
        description: "A property finder website.",
        skills: ["Vue.js", "Nuxt,js", "Vutify", "TailwindCss"],
        roles: [
          "build main architecture of views , components and state management store.",
          "help the team with the blocking tasks",
        ],
      },
      {
        title: "Tamincom Refactor",
        date: "Nov. 2021 - Present",
        description: "Car Insurance Website.",
        skills: ["Vue.js", "Vutify", "Typescript"],
        roles: [
          "Played a pivotal role as the primary frontend developer for a Car Insurance Website.",
        ],
      },
      {
        title: "VIBRANT COMMUNITY",
        date: "Nov. 2021 - Present",
        description: "A Charity Organization website.",
        skills: ["React.js", "Next.js", "MUI"],
        roles: [
          "Designed and established the foundational architecture for views, components, and state management stores.",
        ],
      },
    ],
  },
  {
    role: "Front-End Developer",
    company: "Besteam - Nasr City - Full-time",
    date: "Sep. 2019 - Mar. 2021",
    img: "/images/companies/besteam.png",
    projects: [
      {
        title: "Projects",
        date: "Oct. 2020 - Apr. 2021",
        description: "STEM Education Company.",
        skills: ["Vue.js", "jQuery", "Bootstrap"],
        roles: [
          "Utilized Vue.js and JQuery to create websites for Saudi Robotics competitions as part of our commitment to promoting STEAM education system.",
        ],
      },
    ],
  },
]

const legacyFreelance: LegacyEmployment[] = [
  {
    role: "Front-End Developer",
    company: "The Pick Path Group (USA)",
    date: "2023 - 5 mos",
    img: "/images/companies/commute.jpg",
    projects: [
      {
        title: "Dashboard",
        description:
          "Commutrics offers the comprehensive capabilities and deep industry knowledge necessary to help you solve the challenging issues of commuting to any organization",
        date: "Aug. 2021 - Present",
        skills: ["vue.js", "Ant.Design", "TailwindCss", "vue-query"],
        roles: ["Responsible for all the frontend part."],
      },
    ],
  },
  {
    role: "Senior Front-End Developer",
    company: "Grand Community - Remotely - Part-time",
    date: "2022 - 7 mos",
    img: "/images/companies/grand.png",
    projects: [
      {
        title: "Whatsapp pro",
        description: "Customer Service app based on whatsapp",
        date: "Aug. 2021 - Present",
        skills: ["Vue.js", "Ant.Design", "TailwindCss", "Vue-query"],
        roles: ["Responsible for all the frontend part."],
      },
      {
        title: "GC Website",
        description:
          "The main website of the company and the dashboard for all clients",
        date: "Aug. 2021 - Present",
        skills: ["Vue.js", "Vutify", "TailwindCss", "Vue-query"],
        roles: [
          "Responsible for building dashboard pages.",
          "help and manage the frontend team",
        ],
      },
    ],
  },
  {
    role: "Front-End Developer (NextJS)",
    company: "Alsakn -  FREELANCE",
    date: "2021 - 3 mos",
    img: "/images/companies/alsakn.jpg",
    projects: [
      {
        title: "Alsakn Project",
        description: "A startup like Airbnb for renting and housing.",
        date: "Aug. 2021 - Present",
        skills: ["React.js", "Next.js", "Sass", "Bootstrap"],
        roles: ["Help in structuring of the project and building the team."],
      },
    ],
  },
]

const legacySide: LegacySide[] = [
  {
    name: "Eazy.To",
    date: "2022 - 8 mos",
    img: "/images/companies/eazyto.png",
    projects: [
      {
        title: "Website and Dashboard",
        description:
          "a side project to clone bit.ly with branding and marketing tools",
        date: "Aug. 2021 - Present",
        skills: [
          "React.js",
          "Next.js",
          "Ant.design",
          "TailwindCss | Node.js",
          "Express",
          "MongoDB",
        ],
        roles: ["Responsible for all the frontend part."],
      },
    ],
  },
  {
    name: "Trend.coupons",
    date: "2022 - 5 mos",
    img: "/images/companies/trendcoupons.png",
    projects: [
      {
        title: "Website and Admin panel",
        description:
          "a side project to clone bit.ly with branding and marketing tools",
        date: "Aug. 2021 - Present",
        skills: [
          "React.js",
          "Next.js",
          "Ant.design",
          "TailwindCss | Node.js",
          "Express",
          "MongoDB",
        ],
        roles: ["Responsible for all the frontend part."],
      },
    ],
  },
]

function toHighlight(h: LegacyHighlight): Highlight {
  return {
    title: h.title,
    description: h.description,
    date: h.date,
    skills: h.skills,
    roles: h.roles,
  }
}

function transformEmployment(
  entry: LegacyEmployment,
  kind: "fulltime" | "freelance"
): Experience {
  const company = parseCompany(entry.company)
  const { startDate, endDate } = parseDateRange(entry.date)
  return {
    slug: toSlug(`${company} ${entry.role}`),
    role: entry.role,
    company,
    companyLogo: entry.img,
    kind,
    mode: parseMode(entry.company),
    startDate,
    endDate,
    highlights: entry.projects.map(toHighlight),
  }
}

function transformSide(entry: LegacySide): Experience {
  const { startDate, endDate } = parseDateRange(entry.date)
  return {
    slug: toSlug(`${entry.name} solo`),
    role: "Solo Developer",
    company: entry.name,
    companyLogo: entry.img,
    kind: "side",
    mode: "unknown",
    startDate,
    endDate,
    highlights: entry.projects.map(toHighlight),
  }
}

const rawExperience: Experience[] = [
  ...legacyFulltime.map((e) => transformEmployment(e, "fulltime")),
  ...legacyFreelance.map((e) => transformEmployment(e, "freelance")),
  ...legacySide.map(transformSide),
]

export const experience: readonly Experience[] = Object.freeze(
  ExperienceCollectionSchema.parse(rawExperience)
)
