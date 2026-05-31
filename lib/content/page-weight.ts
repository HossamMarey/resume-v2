import { z } from "zod"

export const PageWeightCategory = z.enum([
  "html",
  "js",
  "css",
  "images",
  "fonts",
])

export const PageWeightItemSchema = z.object({
  category: PageWeightCategory,
  bytes: z.number().int().min(0),
  colorToken: z.enum(["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"]),
})

export type PageWeightItem = z.infer<typeof PageWeightItemSchema>

export const pageWeightBudget: readonly PageWeightItem[] = Object.freeze([
  { category: "html", bytes: 12_288, colorToken: "chart-2" },
  { category: "js", bytes: 87_040, colorToken: "chart-3" },
  { category: "css", bytes: 18_432, colorToken: "chart-1" },
  { category: "images", bytes: 46_080, colorToken: "chart-5" },
  { category: "fonts", bytes: 24_576, colorToken: "chart-4" },
] as const)
