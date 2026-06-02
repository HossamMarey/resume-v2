import { z } from "zod"

export const contactSchema = z.object({
  name: z.string().min(2, "name must be ≥2 chars"),
  email: z.email("email must be a valid address"),
  subject: z.string().max(120, "subject must be ≤120 chars").optional(),
  message: z
    .string()
    .min(20, "message must be ≥20 chars")
    .max(2000, "message must be ≤2000 chars"),
})

export type ContactForm = z.infer<typeof contactSchema>
