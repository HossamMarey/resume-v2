import { z } from "zod"

export const ExperienceType = z.enum(["fulltime", "parttime", "contract"])
export const ExperienceCategory = z.enum(["fulltime", "freelance"])
export const LocationType = z.enum(["remote", "hybrid", "onsite"])

function isValidYearMonth(value: string): boolean {
  const [year, month] = value.split("-").map(Number)
  return month >= 1 && month <= 12 && year >= 1900
}

export const RoleSchema = z
  .object({
    name: z.string().trim().min(1),
    description: z.string().optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .refine(isValidYearMonth, { message: "Invalid month" }),
    endDate: z.union([
      z.literal("present"),
      z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .refine(isValidYearMonth, { message: "Invalid month" }),
    ]),
  })
  .refine(
    (data) => {
      if (data.endDate === "present") return true
      return data.endDate >= data.startDate
    },
    {
      message: "endDate must be on or after startDate",
      path: ["endDate"],
    }
  )

export type Role = z.infer<typeof RoleSchema>

export const ExperienceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  company: z.string().trim().min(1),
  companyLogo: z.string().optional(),
  type: ExperienceType,
  category: ExperienceCategory,
  location: z.string().optional(),
  locationType: LocationType,
  org: z.string().optional(),
  roles: z.array(RoleSchema).min(1),
})

export type Experience = z.infer<typeof ExperienceSchema>

export const ExperienceCollectionSchema = z
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

const rawExperience: z.input<typeof ExperienceSchema>[] = [
  {
    slug: "buguard",
    company: "Buguard",
    type: "fulltime",
    category: "fulltime",
    locationType: "remote",
    org: "Buguard, LLC",
    companyLogo: "/images/companies/buguard.jpg",

    roles: [
      {
        name: "Team Lead",
        startDate: "2025-09",
        endDate: "present",
        description:
          "At Buguard, I served as a Team Lead, managing a diverse team to drive the successful delivery of features from design to production. My role involved collaborating with various functions, including frontend, backend, UI/UX, and QA, to ensure seamless project execution. I leveraged my expertise as a senior frontend developer to guide the team and optimize our development processes.",
      },
      {
        name: "Senior Frontend Developer",
        startDate: "2023-06",
        endDate: "present",
        description: `
        As a Senior Frontend Developer at Buguard, LLC, an Egypt-based cybersecurity firm, my daily responsibilities revolve around frontend development tasks that aim to enhance Buguard's cybersecurity applications and services. At Buguard, we specialize in providing a comprehensive range of cybersecurity solutions, including Application Security, GRC Services, Bug Bounty Programs, Penetration Testing, Dark Web Monitoring, Red Teaming, Security Consultations, Managed Security Services, and Security Outsourcing to major enterprises and midsize companies.

In my role, I get to engage in exciting frontend development activities, working with technologies like HTML, CSS, JavaScript, and frameworks such as React, Angular, or Vue.js to code and maintain our cybersecurity applications. Collaborating closely with our design team, we create user interfaces that are not only visually appealing but also intuitive, enhancing the overall user experience of Buguard's applications.

Performance optimization is a key aspect of my work. I continuously strive to optimize our frontend code, 
As a Senior Frontend Developer, I take pride in maintaining high code quality standards and promoting best practices within our frontend development team. I actively participate in code reviews, adhere to our coding guidelines, and offer mentorship and guidance to junior developers, fostering a collaborative and growth-oriented environment.

In the fast-paced world of cybersecurity, staying up-to-date with the latest frontend technologies and security best practices is crucial. I invest time in continuous learning, attending workshops and conferences, and exploring new ways to enhance our applications' security and performance.

Buguard's mission to provide top-notch cybersecurity services drives me to tackle challenges head-on. Problem-solving is an essential part of my role as I troubleshoot and resolve frontend development issues, ensuring Buguard's applications are always at their best.
`,
      },
    ],
  },
  {
    slug: "masheedgate",
    company: "masheedGATE",
    companyLogo: "/images/companies/masheed.jpg",
    type: "fulltime",
    category: "fulltime",
    location: "Cairo, Egypt",
    locationType: "hybrid",
    org: "MasheedGate",
    roles: [
      {
        name: "Senior Frontend Developer",
        startDate: "2022-11",
        endDate: "2023-07",
        description: `
        development of a cutting-edge e-commerce platform dedicated to selling construction materials.
Implemented Domain-Driven Design (DDD) principles and adopted Monorepos to enhance maintenance and streamline development processes
        `,
      },
    ],
  },
  {
    slug: "inovola",
    company: "Inovola",
    companyLogo: "/images/companies/inovola.jpg",
    type: "fulltime",
    category: "fulltime",
    location: "Al Jizah, Egypt",
    locationType: "remote",
    org: "Inovola",
    roles: [
      {
        name: "Frontend Developer",
        startDate: "2021-04",
        endDate: "2022-09",
      },
    ],
  },
  {
    slug: "be-steam",
    company: "BE-STEAM",
    org: "BE-STEAM",
    companyLogo: "/images/companies/besteam.png",
    type: "fulltime",
    category: "fulltime",
    location: "Cairo, Egypt",
    locationType: "onsite",
    roles: [
      {
        name: "Frontend Developer",
        startDate: "2019-09",
        endDate: "2021-03",
      },
    ],
  },
  {
    slug: "the-pick-path-group",
    company: "The Pick Path Group",
    companyLogo: "/images/companies/commute.jpg",
    type: "contract",
    category: "freelance",
    locationType: "remote",
    org: "The Pick Path Group (USA)",
    roles: [
      {
        name: "Front-End Developer",
        description:
          "Commutrics offers the comprehensive capabilities and deep industry knowledge necessary to help you solve the challenging issues of commuting to any organization",
        startDate: "2023-01",
        endDate: "2023-05",
      },
    ],
  },
  {
    slug: "grand-community",
    company: "Grand Community",
    companyLogo: "/images/companies/grand.png",
    type: "parttime",
    category: "freelance",
    locationType: "remote",
    org: "Grand Community",
    roles: [
      {
        name: "Senior Front-End Developer",
        description:
          "Customer Service app based on whatsapp. The main website of the company and the dashboard for all clients",
        startDate: "2022-01",
        endDate: "2022-07",
      },
    ],
  },
  {
    slug: "alsakn",
    company: "Alsakn",
    companyLogo: "/images/companies/alsakn.jpg",
    type: "contract",
    category: "freelance",
    locationType: "remote",
    org: "Alsakn (Freelance)",
    roles: [
      {
        name: "Front-End Developer (NextJS)",
        description:
          "A startup like Airbnb for renting and housing. Help in structuring of the project and building the team.",
        startDate: "2021-04",
        endDate: "2021-06",
      },
    ],
  },
]

export const experience: readonly Experience[] = Object.freeze(
  ExperienceCollectionSchema.parse(rawExperience)
)
