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

const featuredProjects: z.input<typeof ProjectSchema>[] = [
  {
    slug: "buguard",
    name: "Buguard",
    description:
      "Corporate website for a cybersecurity company that provides penetration testing, GRC, and managed security services across North America, Europe, the Middle East, and Africa.",
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
    images: ["/images/projects/buguard-1.jpg"],
    videos: ["/videos/buguard.mp4"],
    links: {
      preview: "https://buguard.io/",
    },
    problem:
      "The company had no central web presence that covered all their service lines and target regions. Marketing was running campaigns with nowhere solid to send traffic.",
    role: "Senior Front-End Developer. Built the landing page from scratch, with a focus on SEO and marketing needs.",
    decisions: [
      "Went with Next.js (SSR/SSG) so the pages would rank well and load fast.",
      "Paired Ant Design with TailwindCSS to get a consistent design system without writing everything custom.",
      "Added react-pdf so visitors could view security reports directly in the browser.",
    ],
    outcomes: [
      "Launched a responsive, SEO-ready landing page at buguard.io.",
      "Marketing could finally run campaigns with a proper destination and structured content.",
    ],
    featured: true,
  },
  {
    slug: "dark-atlas",
    name: "Dark Atlas Products",
    description:
      "A suite of cybersecurity products under the Dark Atlas brand, including a dark web monitoring platform, threat intelligence dashboards, and brand protection services.",
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
      "/images/projects/darkatlas-1.jpg",
      "/images/projects/darkweb.png",
      "/images/projects/threat.png",
      "/images/projects/asm.png",
      "/images/projects/brand.png",
    ],
    videos: ["/videos/threat.mp4"],
    links: {
      preview: "https://darkatlas.io/",
    },
    problem:
      "Clients needed to know when their credentials or data showed up on the dark web, ideally before anything escalated. There was no dashboard for this.",
    role: "Senior Front-End Developer. Built the monitoring dashboard, including multi-company views and report exports.",
    decisions: [
      "Used react-query to keep the dashboard data fresh with background polling.",
      "Added react-pdf so clients could export and download security reports without leaving the browser.",
      "Built on Next.js since the app needed to support multiple client dashboards with good performance.",
    ],
    outcomes: [
      "Shipped the live monitoring dashboard at darkatlas.io.",
      "Clients can now track leaks and pull reports from one place.",
    ],
    featured: true,
  },
  {
    slug: "masheed-gate",
    name: "Masheed Gate",
    description:
      "E-commerce platform for construction materials, built on a monorepo architecture with Domain-Driven Design.",
    org: "MasheedGate",
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
    images: ["/images/projects/masheed-gate.png"],
    videos: ["/videos/masheed-gate-new-website.mp4"],
    links: {
      preview: "https://www.masheedgate.com/",
    },
    problem:
      "A construction materials supplier needed an e-commerce site that could handle a large, complex product catalog. Multiple teams would be working on it, so the architecture had to support that from day one.",
    role: "Senior Front-End Developer. Led the frontend build and set up the architecture.",
    decisions: [
      "Structured the codebase around Domain-Driven Design to keep business logic organized as the app grew.",
      "Used Nx Monorepo so multiple teams could work in parallel without stepping on each other.",
      "Picked Remix.js for the storefront because its data loading model made the shopping experience faster.",
      "Connected to the backend through GraphQL, which gave the frontend exactly the data it needed per page.",
    ],
    outcomes: [
      "Launched at masheedgate.com with a full product catalog.",
      "The monorepo setup let multiple teams ship independently without merge conflicts slowing things down.",
    ],
    featured: true,
  },
  {
    slug: "me-link",
    name: "Me-Link",
    description:
      "Smart QR Menu & Link-in-Bio for Restaurants & Cafés. “One Link for Menu, Orders, Reviews & Location",
    org: "Side Project",
    type: "web",
    stack: [
      "html",
      "css",
      "tailwindCss",
      "shadcn ui",
      "react",
      "next.js",
      "node.js",
      "express.js",
      "mongodb",
    ],
    images: ["/images/projects/melink.jpg"],
    videos: ["/videos/melink-2.mp4", "/videos/melink-1.mp4"],
    links: {
      preview: "https://me-l.ink/",
    },
    problem:
      "Restaurants need an easy way to share their menus online, get customer feedback, and manage reviews. Most restaurants don’t have a mobile-friendly menu or a simple tool to collect reviews and customer information.",
    role: "Full-Stack Developer. Built everything: frontend, API, and database.",
    decisions: [
      "Built a custom analytics dashboard with Ant Design components to visualize campaign performance.",
      "Added shadcn ui to get a consistent design system without writing everything custom.",
      "Implemented a QR code generator that creates unique QR codes for each restaurant.",
      "Added review collection functionality that allows customers to leave reviews and ratings for the restaurant.",
      "Implemented a location sharing feature that allows customers to get directions to the restaurant.",
    ],
    outcomes: [
      "Shipped at me-l.ink ",
      " Got real restaurant owners to use it and get ",
    ],
    featured: false,
  },

  {
    slug: "whatsapp-pro",
    name: "Whatsapp Pro",
    description:
      "Internal tool for a social media agency to manage WhatsApp conversations with influencers from one place.",
    org: "Grand Community",
    type: "web",
    stack: ["html", "css", "tailwindCss", "ant.design", "vue", "vue-query"],
    images: ["/images/projects/wa.png"],
    videos: ["/videos/whatsup-pro.mp4"],
    links: {},
    problem:
      "The agency was managing influencer conversations across personal phones and accounts. They needed one internal tool where the team could handle all WhatsApp communications.",
    role: "Front-End Developer. Owned the entire frontend.",
    decisions: [
      "Built with Vue.js and vue-query to keep the chat state in sync with the server in real time.",
      "Used Ant Design for the UI since the tool needed to look professional but didn't need a custom design system.",
    ],
    outcomes: [
      "The team moved all influencer communications into the tool and stopped juggling personal phones.",
    ],
    featured: false,
  },
  {
    slug: "gc-dashboard",
    name: "GC Dashboard",
    description:
      "Campaign management dashboard where brands can find influencers, run campaigns, and track results.",
    org: "Grand Community",
    type: "web",
    stack: ["html", "css", "vuetify", "vue", "vue-query", "nuxt"],
    images: ["/images/projects/gc-dash.png"],
    videos: ["/videos/gc_dashboard.mp4"],
    links: {},
    problem:
      "Brands needed a single place to search for influencers, manage ongoing campaigns, and communicate with partners. The agency was doing most of this manually.",
    role: "Front-End Developer. Built dashboard pages and helped lead the frontend team.",
    decisions: [
      "Used Nuxt.js for SSR so campaign landing pages would be indexed by search engines.",
      "Picked Vuetify for its Material Design components, which fit the dashboard use case well.",
    ],
    outcomes: [
      "Shipped a working influencer management dashboard that replaced the manual workflow.",
      "Helped grow the frontend team and set up code patterns the new developers could follow.",
    ],
    featured: false,
  },
  {
    slug: "eazy-to",
    name: "Eazy.to",
    description:
      "URL shortener with built-in campaign tracking and customer data collection. A Bitly alternative with more marketing tools.",
    org: "Side Project",
    type: "web",
    stack: [
      "html",
      "css",
      "tailwindCss",
      "ant.design",
      "react",
      "next.js",
      "node.js",
      "express.js",
      "mongodb",
    ],
    images: ["/images/projects/eazyto.jpg"],
    videos: ["/videos/eazyTo.mp4"],
    links: {
      preview: "https://eazy.to",
    },
    problem:
      "Bitly covers the basics, but I wanted campaign tracking and customer data collection in one tool. Nothing out there did exactly that without enterprise pricing.",
    role: "Full-Stack Developer. Built everything: frontend, API, and database.",
    decisions: [
      "Used Next.js with API routes to keep frontend and backend in one codebase.",
      "Stored link and analytics data in MongoDB since the schema was going to change often during development.",
      "Built a custom analytics dashboard with Ant Design components to visualize campaign performance.",
    ],
    outcomes: [
      "Shipped at eazy.to with working campaign tracking.",
      "Got real users on it and used the data to validate the concept.",
    ],
    featured: false,
  },
  {
    slug: "commutrics-dashboard",
    name: "Commutrics Dashboard",
    description:
      "Enterprise dashboard for tracking and managing employee commuting patterns, with analytics and reporting.",
    org: "The Pick Path Group (USA)",
    type: "web",
    stack: [
      "html",
      "css",
      "ant.design",
      "tailwindCss",
      "react",
      "react-query",
      "chart.js",
    ],
    images: ["/images/projects/commute.png"],
    videos: ["/videos/commutrics.mp4"],
    links: {},
    problem:
      "Companies had no way to see how their employees were commuting. They wanted to understand patterns, spot inefficiencies, and eventually cut costs.",
    role: "Front-End Developer. Built all frontend parts of the dashboard.",
    decisions: [
      "Used Chart.js for the analytics visualizations since the data was chart-heavy (routes, times, modes).",
      "Handled server state with react-query to keep the dashboard data current without manual refreshes.",
    ],
    outcomes: [
      "Delivered a commute analytics dashboard that enterprise clients used to track and adjust employee commuting.",
    ],
    featured: false,
  },
  {
    slug: "builderz",
    name: "BuilderZ",
    description:
      "E-learning platform for creating, selling, and managing both online and in-person courses.",
    org: "Inovola",
    type: "web",
    stack: [
      "html",
      "css",
      "tailwindCss",
      "ant.design",
      "vue",
      "nuxt",
      "firebase",
    ],
    images: ["/images/projects/builderz.jpg"],
    videos: ["/videos/builderz.mp4"],
    links: {
      // preview: "https://brz-test.herokuapp.com/",
    },
    problem:
      "An ed-tech company needed a platform where instructors could create courses (online or offline) and students could buy and access them. Nothing they'd tried fit their workflow.",
    role: "Front-End Developer. Led the frontend build of the platform.",
    decisions: [
      "Used Nuxt.js with SSR so course pages would show up in search results.",
      "Integrated Firebase for auth and real-time data (course progress, notifications).",
      "Combined TailwindCSS with Ant Design to move fast without sacrificing consistency.",
    ],
    outcomes: [
      "Shipped a working e-learning platform with full course management.",
    ],
    featured: false,
  },
  {
    slug: "trend-coupons",
    name: "Trend Coupons",
    description:
      "Automated Udemy coupon aggregator. A Node.js scraper collects free coupons from multiple sources and publishes them to a searchable site.",
    org: "Side Project",
    type: "web",
    stack: [
      "html",
      "css",
      "tailwindCss",
      "ant.design",
      "react",
      "next.js",
      "node.js",
      "express.js",
      "mongodb",
    ],
    images: ["/images/projects/trend.jpg"],
    videos: ["/videos/trendcoupons.mp4"],
    links: {
      preview: "https://www.trend.coupons/",
    },
    problem:
      "Finding free Udemy coupons meant checking a dozen sites manually. I wanted to automate that into one place.",
    role: "Full-Stack Developer. Built the scraper, the API, and the frontend.",
    decisions: [
      "Wrote a Node.js scraper that runs on a schedule and pulls coupons from multiple sources automatically.",
      "Stored coupon data in MongoDB with expiration dates so stale coupons get filtered out.",
      "Built the frontend with Next.js so coupon pages would rank in search results.",
    ],
    outcomes: [
      "Launched at trend.coupons. The whole pipeline runs without manual input.",
      "Coupons get scraped, stored, and published automatically.",
    ],
    featured: false,
  },
  {
    slug: "alsakn",
    name: "Alsakn",
    description:
      "Roommate-finding and housing platform for the Arabic-speaking market, similar in concept to shared-housing sections of Airbnb.",
    org: "Alsakn (Freelance)",
    type: "web",
    stack: ["html", "css", "react", "next.js", "strapi cms", "ant.design"],
    images: ["/images/projects/alsakn.jpg"],
    videos: [],
    links: {
      preview: "https://alsakn.com",
    },
    problem:
      "There was no Arabic-focused platform for finding roommates or short-term housing. People were using generic classifieds or social media groups.",
    role: "Front-End Developer. Set up the project architecture and helped build the frontend team.",
    decisions: [
      "Used Strapi CMS as a headless backend so the content team could manage listings without developer help.",
      "Picked Next.js for SSR, which matters a lot for SEO in the housing and real estate space.",
    ],
    outcomes: [
      "Set up the architecture and team structure. The platform is live at alsakn.com.",
    ],
    featured: false,
  },
  {
    slug: "beacademy",
    name: "BEAcademy",
    description:
      "Social learning network where students and educators can share resources, interact, and learn in a structured environment.",
    org: "BEAcademy",
    type: "web",
    stack: ["html", "css", "sass", "javascript", "tailwindCss", "jQuery"],
    images: ["/images/projects/academy.jpg"],
    videos: ["/videos/be-academy.mp4"],
    links: {
      preview: "https://beacademy.netlify.app/",
    },
    problem:
      "Students and educators had no shared space to exchange knowledge outside of class. Existing social networks weren't built for structured learning.",
    role: "Front-End Developer. Built the entire frontend.",
    decisions: [
      "Went with vanilla JavaScript and jQuery to keep it lightweight. A full framework would have been overkill for this.",
      "Used SASS to keep the stylesheets organized as the project grew.",
    ],
    outcomes: ["Deployed at beacademy.netlify.app."],
    featured: false,
  },
  {
    slug: "tahakoom",
    name: "Tahakoom",
    description:
      "Official website for the Saudi Wireless and Remote Control Sports Federation. Built the frontend and designed the full UI/UX.",
    org: "Saudi WRC Sports Federation",
    type: "web",
    stack: ["html", "css", "sass", "javascript", "bootstrap", "jQuery"],
    images: ["/images/projects/tahakoom.jpg"],
    videos: [],
    links: {
      preview: "http://tahakoom.gov.sa/",
      design: "https://www.behance.net/gallery/93230949/tahakoom-UI-web-Design",
    },
    problem:
      "The federation needed an official .gov.sa website to publish their activities, competition schedules, and organizational information.",
    role: "Front-End Developer and UI/UX Designer. Designed and built everything from scratch.",
    decisions: [
      "Designed the full UI/UX in Adobe XD first, since government sites need a polished, formal look before any code gets written.",
      "Used Bootstrap for the layout to make sure it worked across all device sizes.",
    ],
    outcomes: [
      "Launched the live government site at tahakoom.gov.sa.",
      "Published the design case study on Behance.",
    ],
    featured: false,
  },

  {
    slug: "wro-competitions",
    name: "WRO Competitions",
    description:
      "Website for the Saudi WRO robotics competitions. Built the frontend and designed the UI/UX from scratch.",
    org: "WRO Saudi",
    type: "web",
    stack: ["html", "css", "sass", "javascript", "bootstrap", "jQuery"],
    images: ["/images/projects/wro.jpg"],
    videos: [],
    links: {
      preview: "https://www.wrosaudi.com/",
      design: "https://www.behance.net/gallery/93200737/WroSaud-Ui-Design",
    },
    problem:
      "The Saudi WRO needed a website to publish competition details, schedules, and STEAM education content for students and parents.",
    role: "Front-End Developer and UI/UX Designer. Handled both design and code.",
    decisions: [
      "Created the full UI/UX design first, then built the frontend to match. The design needed to work for both students and parents.",
      "Used Bootstrap for responsive layouts since the audience was split between desktop and mobile.",
    ],
    outcomes: [
      "Launched at wrosaudi.com.",
      "Published the design case study on Behance.",
    ],
    featured: false,
  },

  {
    slug: "motamd",
    name: "Motamd",
    description:
      "Certification management platform for Saudi teachers to apply for and track their professional certifications.",
    org: "Motamd",
    type: "web",
    stack: ["html", "css", "vue"],
    images: ["/images/projects/motamd.jpg"],
    videos: [],
    links: {
      preview: "http://motamd.org/",
    },
    problem:
      "Saudi teachers had no online system to apply for professional certifications. The process was mostly paper-based.",
    role: "Front-End Developer. Built the frontend interface.",
    decisions: [
      "Used Vue.js since the platform is heavily form-based, and Vue's reactivity model made the multi-step forms straightforward.",
    ],
    outcomes: ["Live at motamd.org."],
    featured: false,
  },
]

const rawProjects: z.input<typeof ProjectSchema>[] = [...featuredProjects]

export const projects: readonly Project[] = Object.freeze(
  ProjectsCollectionSchema.parse(rawProjects)
)
