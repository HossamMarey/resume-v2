import { z } from "zod"

export const ProjectMethod = z.enum(["GET", "POST", "PUT", "PATCH"])
export const ProjectStatus = z.enum(["shipped", "ongoing", "archived"])

export const ProjectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  org: z.string(),
  method: ProjectMethod,
  status: ProjectStatus,
  statusCode: z.number().int(),
  type: z.string().min(1),
  size: z.string().min(1),
  sizeWeight: z.number().min(0).max(1),
  time: z.string().min(1),
  timeWeight: z.number().min(0).max(1),
  startOffset: z.number().min(0).max(1),
  year: z.number().int(),
  stack: z.array(z.string().min(1)),
  problem: z.string(),
  role: z.string(),
  decisions: z.array(z.string().min(1)),
  outcomes: z.array(z.string().min(1)),
  links: z.array(
    z.object({
      label: z.string().min(1),
      href: z.string().url(),
    })
  ),
})

export type Project = z.infer<typeof ProjectSchema>

const ProjectsCollectionSchema = z
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

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

type LegacyLink = { label: string; href: string | null }

function toLinks(
  preview: string | null,
  code: string | null,
  design: string | null
): Project["links"] {
  const candidates: LegacyLink[] = [
    { label: "Preview", href: preview },
    { label: "Code", href: code },
    { label: "Design", href: design },
  ]
  return candidates
    .filter(
      (l): l is { label: string; href: string } =>
        typeof l.href === "string" && l.href.startsWith("http")
    )
    .map(({ label, href }) => ({ label, href }))
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

function transform(entry: LegacyEntry): Project {
  return {
    slug: toSlug(entry.title),
    name: entry.title,
    org: "",
    method: "GET",
    status: "archived",
    statusCode: 200,
    type: "web",
    size: "Side Project",
    sizeWeight: 0.3,
    time: "1 mo",
    timeWeight: 0.1,
    startOffset: 0,
    year: 2022,
    stack: entry.tags,
    problem: entry.description,
    role: "",
    decisions: [],
    outcomes: [],
    links: toLinks(entry.links.preview, entry.links.code, entry.links.design),
  }
}

const legacyProjects: LegacyEntry[] = [
  {
    title: "Buguard",
    description:
      "Buguard, LLC is a multinational cybersecurity firm offering various services to companies worldwide, including penetration testing, GRC services, and managed security services. They operate in North America, Europe, the Middle East and Africa",
    tags: [
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
    links: { preview: "https://buguard.io/", code: null, design: null },
  },
  {
    title: "Dark Atlas",
    description:
      "Dark Atlas is a proactive dark web monitoring platform that helps businesses prevent data breaches",
    tags: [
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
    links: { preview: "https://darkatlas.io/", code: null, design: null },
  },
  {
    title: "Masheed Gate",
    description:
      "We are building a new E-commerce website for selling construction materials",
    tags: [
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
    links: {
      preview: "https://www.masheedgate.com/",
      code: null,
      design: null,
    },
  },
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

const rawProjects: Project[] = legacyProjects.map(transform)

export const projects: readonly Project[] = Object.freeze(
  ProjectsCollectionSchema.parse(rawProjects)
)
