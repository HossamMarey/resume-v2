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
    images: ["https://hossammarey.com/images/projects/buguard.jpg"],
    videos: [],
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
    name: "Dark Atlas",
    description:
      "Dark web monitoring platform that scans for leaked credentials and sensitive data to help businesses catch breaches early.",
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
    images: ["https://hossammarey.com/images/projects/dark-atlas.jpg"],
    videos: [],
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
    images: ["https://hossammarey.com/images/projects/masheed-gate.png"],
    videos: [],
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
    images: ["https://hossammarey.com/images/projects/eazyto.jpg"],
    videos: [],
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
    slug: "whatsapp-pro",
    name: "Whatsapp Pro",
    description:
      "Internal tool for a social media agency to manage WhatsApp conversations with influencers from one place.",
    org: "Grand Community",
    type: "web",
    stack: ["html", "css", "tailwindCss", "ant.design", "vue", "vue-query"],
    images: ["https://hossammarey.com/images/projects/wa.png"],
    videos: [],
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
    images: ["https://hossammarey.com/images/projects/gc-dash.png"],
    videos: [],
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
    images: ["https://hossammarey.com/images/projects/commute.png"],
    videos: [],
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
    stack: ["html", "css", "tailwindCss", "ant.design", "vue", "nuxt", "firebase"],
    images: ["https://hossammarey.com/images/projects/builderz.jpg"],
    videos: [],
    links: {
      preview: "https://brz-test.herokuapp.com/",
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
    images: ["https://hossammarey.com/images/projects/trend.jpg"],
    videos: [],
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
    images: ["https://hossammarey.com/images/projects/alsakn.jpg"],
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
    images: ["https://hossammarey.com/images/projects/academy.jpg"],
    videos: [],
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
    outcomes: [
      "Deployed at beacademy.netlify.app.",
    ],
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
    images: ["https://hossammarey.com/images/projects/tahakoom.jpg"],
    videos: [],
    links: {
      preview: "http://tahakoom.gov.sa/",
      design:
        "https://www.behance.net/gallery/93230949/tahakoom-UI-web-Design",
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
    slug: "genwin-app",
    name: "Genwin App",
    description:
      "Donation and fundraising platform with onboarding flows for marketing campaigns.",
    org: "Genwin",
    type: "web",
    stack: ["html", "css", "sass", "vue", "nuxt"],
    images: ["https://hossammarey.com/images/projects/genwin.jpg"],
    videos: [],
    links: {
      preview: "https://newwc.genwin.app/login",
    },
    problem:
      "Genwin was running donation campaigns but had no proper onboarding flow to guide users through the process. Conversion was lower than it should have been.",
    role: "Front-End Developer. Part of the frontend team, built campaign and onboarding views.",
    decisions: [
      "Used Nuxt.js for SSR so campaign landing pages could be found through search.",
      "Kept styling in SASS modules to stay organized across multiple campaign variants.",
    ],
    outcomes: [
      "Shipped working onboarding flows for donation campaigns.",
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
    images: ["https://hossammarey.com/images/projects/wro.jpg"],
    videos: [],
    links: {
      preview: "https://www.wrosaudi.com/",
      design:
        "https://www.behance.net/gallery/93200737/WroSaud-Ui-Design",
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
    slug: "shortly",
    name: "Shortly",
    description:
      "Landing page built as a teaching example for a CSS Udemy course. Pure HTML and CSS, no frameworks.",
    org: "Personal / Course Project",
    type: "web",
    stack: ["html", "css"],
    images: ["https://hossammarey.com/images/projects/shortly.jpg"],
    videos: [],
    links: {
      preview:
        "https://css-course-projects.netlify.app/shortly/index.html",
      code: "https://github.com/HossamMarey/css-course-projects",
    },
    problem:
      "I needed a real-world landing page for my CSS course that showed students responsive design and layout techniques without any framework hiding the CSS.",
    role: "Developer and Instructor. Created the project for my Udemy CSS course.",
    decisions: [
      "Kept it to pure HTML and CSS so students could see exactly what was happening without framework abstraction.",
      "Focused on Flexbox and Grid layouts since those are what students will actually use on the job.",
    ],
    outcomes: [
      "Live at Netlify as a course example.",
      "Source code on GitHub for students to study and fork.",
    ],
    featured: false,
  },
  {
    slug: "foodery-mobile-view",
    name: "Foodery Mobile View",
    description:
      "Mobile web view for a food delivery app, designed to match the native app experience in a browser.",
    org: "Personal Project",
    type: "web",
    stack: ["html", "css", "sass", "bootstrap", "vue"],
    images: ["https://hossammarey.com/images/projects/foodery.jpg"],
    videos: [],
    links: {
      preview: "https://foodery-mobile.netlify.app/",
    },
    problem:
      "The food delivery app needed a web version for mobile browsers that felt as close to the native app as possible.",
    role: "Front-End Developer. Built the entire mobile web view.",
    decisions: [
      "Used Vue.js so the UI interactions would match the native app's feel.",
      "Built mobile-first with Bootstrap and SASS.",
    ],
    outcomes: [
      "Live at foodery-mobile.netlify.app.",
    ],
    featured: false,
  },
  {
    slug: "slacky",
    name: "Slacky",
    description:
      "Slack clone with real-time messaging and channel management, built with React and Firebase.",
    org: "Personal Project",
    type: "web",
    stack: ["html", "css", "sass", "bootstrap", "React", "Firebase"],
    images: ["https://hossammarey.com/images/projects/slacky.jpg"],
    videos: [],
    links: {
      preview: "https://slacky.netlify.app/",
      repo: "https://github.com/HossamMarey/react-slack-clone",
    },
    problem:
      "Wanted to build something non-trivial with React and Firebase to learn real-time architecture in practice.",
    role: "Full-Stack Developer. Built it all from scratch.",
    decisions: [
      "Used Firebase Realtime Database for instant message syncing. No need to set up WebSocket infrastructure.",
      "Handled auth through Firebase Auth to skip building a backend auth system.",
    ],
    outcomes: [
      "Working Slack clone live at slacky.netlify.app.",
      "Code is open source on GitHub.",
    ],
    featured: false,
  },
  {
    slug: "alakeel",
    name: "Alakeel",
    description:
      "Restaurant landing page built as a teaching example for a CSS Udemy course, covering typography, layout, and visual hierarchy.",
    org: "Personal / Course Project",
    type: "web",
    stack: ["html", "css"],
    images: ["https://hossammarey.com/images/projects/alakeel.jpg"],
    videos: [],
    links: {
      preview:
        "https://css-course-projects.netlify.app/resturant/index.html",
      code: "https://github.com/HossamMarey/css-course-projects",
    },
    problem:
      "Needed a restaurant-themed landing page for the CSS course that would teach typography and visual hierarchy through a realistic example.",
    role: "Developer and Instructor. Created the project for the course curriculum.",
    decisions: [
      "Pure HTML and CSS only, to keep students focused on styling fundamentals.",
      "Used CSS custom properties and Flexbox throughout.",
    ],
    outcomes: [
      "Published as a live course example.",
      "Source code available on GitHub.",
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
    images: ["https://hossammarey.com/images/projects/motamd.jpg"],
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
    outcomes: [
      "Live at motamd.org.",
    ],
    featured: false,
  },
  {
    slug: "tvflix",
    name: "TVFLIX",
    description:
      "TV show browser built with React as a teaching project for a Udemy course. Pulls data from a public API.",
    org: "Personal / Course Project",
    type: "web",
    stack: ["html", "css", "bootstrap", "react"],
    images: ["https://hossammarey.com/images/projects/tvflix.jpg"],
    videos: [],
    links: {
      preview: "https://show-react.netlify.app/",
      repo: "https://github.com/HossamMarey/tv-shows",
    },
    problem:
      "I needed a project for my React course that would show students how to fetch data from an API, manage state, and structure components in a real app.",
    role: "Developer and Instructor. Built it as a course teaching example.",
    decisions: [
      "Connected to a public TV shows API so students could see real data fetching, not mock data.",
      "Used Bootstrap for layout to keep the focus on React concepts, not CSS.",
    ],
    outcomes: [
      "Live at show-react.netlify.app.",
      "Code on GitHub for students to reference.",
    ],
    featured: false,
  },
  {
    slug: "discord-clone",
    name: "Discord Clone",
    description:
      "Pixel-accurate Discord landing page recreation, built with pure HTML and CSS as a course project.",
    org: "Personal / Course Project",
    type: "web",
    stack: ["html", "css"],
    images: ["https://hossammarey.com/images/projects/discord.jpg"],
    videos: [],
    links: {
      preview:
        "https://css-course-projects.netlify.app/discord-clone/index.html",
      code: "https://github.com/HossamMarey/css-course-projects",
    },
    problem:
      "Wanted a challenging CSS exercise for the course where students would replicate a complex, multi-section layout from a real product.",
    role: "Developer and Instructor. Built the clone for the course.",
    decisions: [
      "Pure HTML and CSS only. The whole point was to challenge students to match a complex UI without any framework help.",
    ],
    outcomes: [
      "Live on Netlify as a course example.",
      "Source code on GitHub.",
    ],
    featured: false,
  },
  {
    slug: "awnbank",
    name: "AwnBank",
    description:
      "E-commerce website for AwnBank Store. Handled both the UI/UX design and the frontend build.",
    org: "AwnBank",
    type: "web",
    stack: ["html", "css", "sass", "bootstrap", "javascript", "jQuery"],
    images: ["https://hossammarey.com/images/projects/awnbank.jpg"],
    videos: [],
    links: {
      preview: "http://awnbank.com/",
      design:
        "https://www.behance.net/gallery/93227291/AwnBank-Ecommerce-ui-design",
    },
    problem:
      "AwnBank needed an online store with a custom design. They didn't want a template; they wanted something built specifically for their brand.",
    role: "Front-End Developer and UI/UX Designer. Designed and built the whole thing.",
    decisions: [
      "Designed the full UI/UX in Adobe XD before writing any code, so the client could approve the look before development started.",
      "Used jQuery and vanilla JS for interactivity. A framework would have been more tooling than this project needed.",
      "Organized styles with SASS to keep the stylesheet manageable as pages were added.",
    ],
    outcomes: [
      "Live at awnbank.com.",
      "Published the design case study on Behance.",
    ],
    featured: false,
  },
];



const rawProjects: z.input<typeof ProjectSchema>[] = [
  ...featuredProjects,
]

export const projects: readonly Project[] = Object.freeze(
  ProjectsCollectionSchema.parse(rawProjects)
)
