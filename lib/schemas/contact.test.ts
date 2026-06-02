import { contactSchema } from "@/lib/schemas/contact"

const valid = {
  name: "Ada",
  email: "ada@example.com",
  subject: "Hello",
  message: "This is a sufficiently long message body.",
}

describe("contactSchema", () => {
  it("parses a valid payload", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
  })

  it("accepts an omitted subject", () => {
    const { subject, ...rest } = valid
    void subject
    expect(contactSchema.safeParse(rest).success).toBe(true)
  })

  it("rejects a name shorter than 2 chars", () => {
    expect(contactSchema.safeParse({ ...valid, name: "A" }).success).toBe(false)
  })

  it("rejects an invalid email", () => {
    expect(contactSchema.safeParse({ ...valid, email: "nope" }).success).toBe(
      false
    )
  })

  it("rejects a subject over 120 chars", () => {
    expect(
      contactSchema.safeParse({ ...valid, subject: "x".repeat(121) }).success
    ).toBe(false)
  })

  it("rejects a message shorter than 20 chars", () => {
    expect(
      contactSchema.safeParse({ ...valid, message: "too short" }).success
    ).toBe(false)
  })

  it("rejects a message over 2000 chars", () => {
    expect(
      contactSchema.safeParse({ ...valid, message: "x".repeat(2001) }).success
    ).toBe(false)
  })
})
