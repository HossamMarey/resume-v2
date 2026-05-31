import { z } from "zod"

export const SkillLevel = z.union([z.literal(1), z.literal(2), z.literal(3)])

export const SkillTier = z.union([z.literal("primary"), z.literal("secondary")])

export const SkillSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  level: SkillLevel,
  tier: SkillTier,
})

export type Skill = z.infer<typeof SkillSchema>

export const SkillGroupSchema = z.object({
  name: z.string().min(1),
  skills: z.array(SkillSchema).min(1),
})

export type SkillGroup = z.infer<typeof SkillGroupSchema>

const SkillGroupsCollectionSchema = z
  .array(SkillGroupSchema)
  .superRefine((groups, ctx) => {
    const seen = new Map<string, number>()
    groups.forEach((g, idx) => {
      const prev = seen.get(g.name)
      if (prev !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [idx, "name"],
          message: `Duplicate group "${g.name}" (also at index ${prev})`,
        })
      }
      seen.set(g.name, idx)
    })
  })

type LegacySkill = {
  title: string
  img?: string
  level: 1 | 2 | 3
}

type LegacyGroup = {
  group: string
  data: LegacySkill[]
}

const legacy: LegacyGroup[] = [
  {
    group: "Main skills",
    data: [
      { title: "HTML", img: "/images/skills/html.png", level: 1 },
      { title: "CSS", img: "/images/skills/css.png", level: 1 },
      { title: "SASS", img: "/images/skills/sass.png", level: 1 },
      { title: "Javascript", img: "/images/skills/javascript.png", level: 1 },
      { title: "Typescript", img: "/images/skills/typescript.png", level: 1 },
      { title: "jQuery", img: "/images/skills/jQuery.png", level: 1 },
      { title: "Bootstrap", img: "/images/skills/bootstrap.png", level: 1 },
      { title: "TailwindCss", img: "/images/skills/tailwindcss.png", level: 1 },
      { title: "Ant Design", img: "/images/skills/ant.png", level: 1 },
      { title: "Material Ui", img: "/images/skills/material.png", level: 1 },
      { title: "React.js", img: "/images/skills/react.png", level: 1 },
      { title: "Redux", img: "/images/skills/redux.png", level: 1 },
      { title: "Next.js", img: "/images/skills/next.png", level: 1 },
      { title: "SWR", img: "/images/skills/swr.png", level: 1 },
      { title: "Vue.js", img: "/images/skills/vue.png", level: 1 },
      { title: "Nuxt.js", img: "/images/skills/nuxt.png", level: 1 },
      { title: "Vuetify", img: "/images/skills/vuetify.png", level: 1 },
      { title: "Vue Query", img: "/images/skills/vue-query.png", level: 1 },
      { title: "GraphQl", img: "/images/skills/graphql.png", level: 2 },
      { title: "Firebase", img: "/images/skills/firebase.png", level: 2 },
    ],
  },
  {
    group: "Basics",
    data: [
      { title: "Node (express.js)", img: "/images/skills/node.png", level: 2 },
      { title: "MongoDb", img: "/images/skills/mongodb.png", level: 2 },
      {
        title: "React-Native",
        img: "/images/skills/react-native.png",
        level: 2,
      },
    ],
  },
  {
    group: "Tools",
    data: [
      { title: "GIT", img: "/images/skills/git.png", level: 2 },
      { title: "Postman", img: "/images/skills/postman.png", level: 2 },
      { title: "Adobe XD", img: "/images/skills/adobexd.png", level: 2 },
      { title: "VS Code", img: "/images/skills/vscode.png", level: 2 },
      { title: "Illustrator", img: "/images/skills/Illustrator.png", level: 2 },
    ],
  },
]

const rawSkillGroups: SkillGroup[] = legacy.map((g) => ({
  name: g.group,
  skills: g.data.map((s) => ({
    name: s.title,
    icon: s.img,
    level: s.level,
    tier: s.level === 1 ? "primary" : "secondary",
  })),
}))

export const skillGroups: readonly SkillGroup[] = Object.freeze(
  SkillGroupsCollectionSchema.parse(rawSkillGroups)
)

export const primarySkills: readonly Skill[] = Object.freeze(
  skillGroups.flatMap((g) => g.skills).filter((s) => s.tier === "primary")
)
