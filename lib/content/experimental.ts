import { z } from "zod"

export const ExperimentalSchema = z.object({
  title: z.string(),
  lines: z.array(z.string()),
})

export type Experimental = z.infer<typeof ExperimentalSchema>

// OQ3 — real content required. Ship disabled until Hossam provides copy.
// To enable: replace `lines: []` with real lines and the unlock becomes active.
export const experimental: Experimental = {
  title: "",
  lines: [],
}

export const EXPERIMENTAL_ENABLED = experimental.lines.length > 0
