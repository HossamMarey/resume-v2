import { z } from "zod"

export const ProjectSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    description: z.string().min(1),
    org: z.string().default(""),
    type: z.string().min(1).default("web"),
    stack: z.array(z.string().min(1)).default([]),
    images: z.array(z.string().min(1)).default([]),
    videos: z.array(z.string().min(1)).default([]),
    links: z
      .object({
        preview: z.string().url().optional(),
        code: z.string().url().optional(),
        design: z.string().url().optional(),
        repo: z.string().url().optional(),
        docs: z.string().url().optional(),
      })
      .default({}),
    problem: z.string().default(""),
    role: z.string().default(""),
    decisions: z.array(z.string().min(1)).default([]),
    outcomes: z.array(z.string().min(1)).default([]),
    featured: z.boolean().default(false),
  })
  .required({ slug: true, name: true, description: true })

export type Project = z.infer<typeof ProjectSchema>

export const ProjectsCollectionSchema = z
  .array(ProjectSchema)
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

const LINK_LABELS: Record<string, string> = {
  preview: "Live Preview",
  code: "Source Code",
  design: "Design",
  repo: "Repository",
  docs: "Documentation",
}

const LINK_ORDER: (keyof Project["links"])[] = [
  "preview",
  "code",
  "design",
  "repo",
  "docs",
]

export function projectLinkList(
  links: Project["links"]
): { label: string; href: string; kind: keyof Project["links"] }[] {
  const result: {
    label: string
    href: string
    kind: keyof Project["links"]
  }[] = []
  for (const kind of LINK_ORDER) {
    const href = links[kind]
    if (href) {
      result.push({ label: LINK_LABELS[kind], href, kind })
    }
  }
  return result
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

type LegacyEntry = {
  title: string
  description: string
  tags: string[]
  links: {
    preview: string | null
    code: string | null
    design: string | null
  }
}

function isValidUrl(value: string | null): value is string {
  if (typeof value !== "string") return false
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

function transform(entry: LegacyEntry): Omit<
  Project,
  "slug" | "name" | "description"
> & {
  slug: string
  name: string
  description: string
} {
  const links: { preview?: string; code?: string; design?: string } = {}
  if (isValidUrl(entry.links.preview)) links.preview = entry.links.preview
  if (isValidUrl(entry.links.code)) links.code = entry.links.code
  if (isValidUrl(entry.links.design)) links.design = entry.links.design

  return {
    slug: toSlug(entry.title),
    name: entry.title,
    description: entry.description,
    org: "",
    type: "web",
    stack: entry.tags,
    images: [],
    videos: [],
    links,
    problem: "",
    role: "",
    decisions: [],
    outcomes: [],
    featured: false,
  }
}

const featuredProjects: z.input<typeof ProjectSchema>[] = [
  {
    slug: "buguard",
    name: "Buguard landingpage",
    description:
      "A cybersecurity platform providing unified threat intelligence and monitoring across multiple regions for a multinational firm.",
    org: "Buguard, LLC",
    type: "web",
    stack: [
      "html",
      "css",
      "tailwindCss",
      "ant.design",
      "react",
      "next.js",
      "react-query",
      "typescript",
      "react-pdf",
    ],
    images: [
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=675&fit=crop",
      "https://images.unsplash.com/photo-1563013544-824ae1f70498?w=1200&h=675&fit=crop",
    ],
    videos: [],
    links: {
      preview: "https://buguard.io/",
    },
    problem:
      "[PLACEHOLDER — awaiting authored content] Multinational cybersecurity firm needing a unified platform across regions.",
    role: "[PLACEHOLDER — awaiting authored content] Lead front-end developer.",
    decisions: [
      "[PLACEHOLDER] Architecture decision to be authored by Hossam.",
    ],
    outcomes: ["[PLACEHOLDER] Key outcome to be authored by Hossam."],
    featured: true,
  },
  {
    slug: "dark-atlas",
    name: "Dark Atlas",
    description:
      "Proactive dark web monitoring platform to help businesses prevent data breaches and protect sensitive information.",
    org: "Dark Atlas",
    type: "web",
    stack: [
      "html",
      "css",
      "tailwindCss",
      "ant.design",
      "react",
      "next.js",
      "react-query",
      "typescript",
      "react-pdf",
    ],
    images: [],
    videos: [],
    links: {
      preview: "https://darkatlas.io/",
    },
    problem:
      "[PLACEHOLDER — awaiting authored content] Proactive dark web monitoring platform to help businesses prevent data breaches.",
    role: "[PLACEHOLDER — awaiting authored content] Lead front-end developer.",
    decisions: [
      "[PLACEHOLDER] Architecture decision to be authored by Hossam.",
    ],
    outcomes: ["[PLACEHOLDER] Key outcome to be authored by Hossam."],
    featured: true,
  },
  {
    slug: "masheed-gate",
    name: "Masheed Gate",
    description:
      "E-commerce platform for selling construction materials with a comprehensive catalog and order management system.",
    org: "Masheed Gate",
    type: "web",
    stack: [
      "html",
      "css",
      "tailwindCss",
      "ant.design",
      "react",
      "remix",
      "graphql-request",
      "nx monorepo",
      "react-query",
      "typescript",
    ],
    images: [],
    videos: [],
    links: {
      preview: "https://www.masheedgate.com/",
    },
    problem:
      "[PLACEHOLDER — awaiting authored content] E-commerce platform for selling construction materials.",
    role: "[PLACEHOLDER — awaiting authored content] Lead front-end developer.",
    decisions: [
      "[PLACEHOLDER] Architecture decision to be authored by Hossam.",
    ],
    outcomes: ["[PLACEHOLDER] Key outcome to be authored by Hossam."],
    featured: true,
  },
]

const legacyProjects: LegacyEntry[] = [
  {
    title: "Eazy.to",
    description:
      "A side project to clone bitly and add more features for marketing campaigns and collecting customer data",
    tags: [
      "html",
      "css",
      "tailwindCss",
      "ant.design",
      "react",
      "next",
      "node.js",
      "express.js",
      "mongodb",
    ],
    links: { preview: "https://eazy.to", code: null, design: null },
  },
  {
    title: "Whatsapp Pro",
    description:
      "Internal chat to communicate with influncers through whatsapp",
    tags: ["html", "css", "tailwindCss", "ant.design", "vue", "vue-query"],
    links: { preview: "/videos", code: null, design: null },
  },
  {
    title: "GC Dashboard",
    description:
      "Dashboard app that allows brands to communicate with Influncers",
    tags: ["html", "css", "vuetify", "vue", "vue-query", "nuxt"],
    links: { preview: "/videos", code: null, design: null },
  },
  {
    title: "Commutrics Dashboard",
    description:
      "Dashboard app that allows commpanies to controle how employees commuting",
    tags: [
      "html",
      "css",
      "ant.design",
      "tailwindCss",
      "react",
      "react-query",
      "chart.js",
    ],
    links: { preview: "/videos", code: null, design: null },
  },
  {
    title: "BuilderZ",
    description:
      "A professional plateform for online and offline courses management ",
    tags: [
      "html",
      "css",
      "tailwindCss",
      "ant.design",
      "vue",
      "nuxt",
      "firebase",
    ],
    links: {
      preview: "https://brz-test.herokuapp.com/",
      code: null,
      design: null,
    },
  },
  {
    title: "Trend Coupons",
    description:
      "A professional project for Sharing udemy coupons automaticly, I had used nodeJS web scraping to automate website and collect coupons from other websites",
    tags: [
      "html",
      "css",
      "tailwindCss",
      "ant.design",
      "react",
      "next",
      "node.js",
      "express.js",
      "mongodb",
    ],
    links: {
      preview: "https://www.trend.coupons/",
      code: null,
      design: null,
    },
  },
  {
    title: "Alsakn",
    description:
      "A startup to build roommates community , still under developmenr ...",
    tags: ["html", "css", "react", "next", "strapi cms", "ant.design"],
    links: { preview: "https://alsakn.com", code: null, design: null },
  },
  {
    title: "BEAcademy",
    description: "A social educational network",
    tags: ["html", "css", "sass", "javascript", "tailwindCss", "jQuery"],
    links: {
      preview: "https://beacademy.netlify.app/",
      code: null,
      design: null,
    },
  },
  {
    title: "Tahakoom",
    description:
      "A professional project for Saudi Wireless & Remote Control Sports Federation & Robot , I built the Front-End part from scratch & the UI/UX Design",
    tags: ["html", "css", "sass", "javascript", "bootstrap", "jQuery"],
    links: {
      preview: "http://tahakoom.gov.sa/",
      code: null,
      design: "https://www.behance.net/gallery/93230949/tahakoom-UI-web-Design",
    },
  },
  {
    title: "Genwin app",
    description:
      "part of the front-end team  - using NuxtJs - it's onboarding markiting campaigns to collect funds and donations",
    tags: ["html", "css", "sass", "vue", "nuxt"],
    links: {
      preview: "https://newwc.genwin.app/login",
      code: null,
      design: null,
    },
  },
  {
    title: "WRO Competions",
    description:
      "A professional project for Saudi WRO robotics competitions , I built the Front-End part from scratch & the UI/UX Design",
    tags: ["html", "css", "sass", "javascript", "bootstrap", "jQuery"],
    links: {
      preview: "https://www.wrosaudi.com/",
      code: null,
      design: "https://www.behance.net/gallery/93200737/WroSaud-Ui-Design",
    },
  },
  {
    title: "Shortly",
    description: "A beautiful landing page, designed for my udemy course",
    tags: ["html", "css"],
    links: {
      preview: "https://css-course-projects.netlify.app/shortly/index.html",
      code: "https://github.com/HossamMarey/css-course-projects",
      design: null,
    },
  },
  {
    title: "Foodery Mobile view",
    description: "a web view for mobile only E-commerce app",
    tags: ["html", "css", "sass", "bootstrap", "vue"],
    links: {
      preview: "https://foodery-mobile.netlify.app/",
      code: null,
      design: "https://github.com/HossamMarey/todo-react-redux",
    },
  },
  {
    title: "Slacky",
    description: "Slack clone using react and firebase",
    tags: ["html", "css", "sass", "bootstrap", "React", "Firebase"],
    links: {
      preview: "https://slacky.netlify.app/",
      code: null,
      design: "https://github.com/HossamMarey/react-slack-clone",
    },
  },
  {
    title: "Alakeel",
    description: "A beautiful landing page, designed for my udemy course",
    tags: ["html", "css"],
    links: {
      preview: "https://css-course-projects.netlify.app/resturant/index.html",
      code: "https://github.com/HossamMarey/css-course-projects",
      design: null,
    },
  },
  {
    title: "Motamd",
    description: "Project for Saudi teachers to be certificated",
    tags: ["html", "css", "vue"],
    links: { preview: "http://motamd.org/", code: null, design: null },
  },
  {
    title: "TVFLIX",
    description: "A react project, designed for my udemy course",
    tags: ["html", "css", "bootstrap", "react"],
    links: {
      preview: "https://show-react.netlify.app/",
      code: null,
      design: "https://github.com/HossamMarey/tv-shows",
    },
  },
  {
    title: "Discord Clone",
    description: "A beautiful landing page, designed for my udemy course",
    tags: ["html", "css"],
    links: {
      preview:
        "https://css-course-projects.netlify.app/discord-clone/index.html",
      code: "https://github.com/HossamMarey/css-course-projects",
      design: null,
    },
  },
  {
    title: "AwnBank",
    description:
      "A professional project for AwnBank Store , I built the Front-End part from scratch & the UI/UX Design",
    tags: ["html", "css", "sass", "bootstrap", "javascript", "jQuery"],
    links: {
      preview: "http://awnbank.com/",
      code: null,
      design:
        "https://www.behance.net/gallery/93227291/AwnBank-Ecommerce-ui-design",
    },
  },
]

const rawProjects: z.input<typeof ProjectSchema>[] = [
  ...featuredProjects,
  ...legacyProjects.map(transform),
]

export const projects: readonly Project[] = Object.freeze(
  ProjectsCollectionSchema.parse(rawProjects)
)
