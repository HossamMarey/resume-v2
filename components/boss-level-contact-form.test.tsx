import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { BossLevelContactForm } from "@/components/boss-level-contact-form"

vi.mock("@/hooks/use-should-animate", () => ({
  useShouldAnimate: () => false,
}))

describe("BossLevelContactForm", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders the form with name field and prompt", () => {
    render(<BossLevelContactForm />)

    expect(screen.getByLabelText(/who's asking/i)).toBeInTheDocument()
    expect(
      screen.getByRole("textbox", { name: /who's asking/i })
    ).toBeInTheDocument()
  })

  it("does not reveal email when name is too short", () => {
    render(<BossLevelContactForm />)

    const nameInput = screen.getByRole("textbox", { name: /who's asking/i })
    expect(nameInput).toBeInTheDocument()

    // Email should not be visible yet
    expect(screen.queryByLabelText(/where do I reply/i)).not.toBeInTheDocument()
  })

  it("reveals email and moves focus on valid name + Enter", async () => {
    const user = userEvent.setup()
    render(<BossLevelContactForm />)

    const nameInput = screen.getByRole("textbox", { name: /who's asking/i })
    await user.type(nameInput, "Ada")
    await user.keyboard("{Enter}")

    expect(screen.getByLabelText(/where do I reply/i)).toBeInTheDocument()
    expect(
      screen.getByRole("textbox", { name: /where do I reply/i })
    ).toHaveFocus()
  })

  it("moves focus to previous field on ArrowUp", async () => {
    const user = userEvent.setup()
    render(<BossLevelContactForm />)

    const nameInput = screen.getByRole("textbox", { name: /who's asking/i })
    await user.type(nameInput, "Ada")
    await user.keyboard("{Enter}")

    const emailInput = screen.getByRole("textbox", {
      name: /where do I reply/i,
    })
    expect(emailInput).toHaveFocus()

    await user.keyboard("{ArrowUp}")
    expect(nameInput).toHaveFocus()
  })

  it("clears current field on Escape", async () => {
    const user = userEvent.setup()
    render(<BossLevelContactForm />)

    const nameInput = screen.getByRole("textbox", { name: /who's asking/i })
    await user.type(nameInput, "Ada")
    expect(nameInput).toHaveValue("Ada")

    await user.keyboard("{Escape}")
    expect(nameInput).toHaveValue("")
  })

  it("textarea accepts newlines (Enter does not advance)", async () => {
    const user = userEvent.setup()
    render(<BossLevelContactForm />)

    // Reveal all fields
    const nameInput = screen.getByRole("textbox", { name: /who's asking/i })
    await user.type(nameInput, "Ada")
    await user.keyboard("{Enter}")

    const emailInput = screen.getByRole("textbox", {
      name: /where do I reply/i,
    })
    await user.type(emailInput, "ada@example.com")
    await user.keyboard("{Enter}")

    const subjectInput = screen.getByRole("textbox", { name: /re:/i })
    await user.type(subjectInput, "Hello")
    await user.keyboard("{Enter}")

    const messageInput = screen.getByRole("textbox", { name: /your move/i })
    expect(messageInput).toHaveFocus()

    // Enter in textarea should add a newline
    await user.type(messageInput, "Line 1")
    await user.keyboard("{Enter}")
    await user.type(messageInput, "Line 2")

    expect(messageInput).toHaveValue("Line 1\nLine 2")
  })

  it("shows disabled submit button after message is revealed", async () => {
    const user = userEvent.setup()
    render(<BossLevelContactForm />)

    // Reveal all fields
    const nameInput = screen.getByRole("textbox", { name: /who's asking/i })
    await user.type(nameInput, "Ada")
    await user.keyboard("{Enter}")

    const emailInput = screen.getByRole("textbox", {
      name: /where do I reply/i,
    })
    await user.type(emailInput, "ada@example.com")
    await user.keyboard("{Enter}")

    const subjectInput = screen.getByRole("textbox", { name: /re:/i })
    await user.type(subjectInput, "Hello")
    await user.keyboard("{Enter}")

    const submitButton = screen.getByRole("button", { name: /send/i })
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it("renders honeypot input with correct a11y attributes", () => {
    const { container } = render(<BossLevelContactForm />)

    const honeypot = container.querySelector('input[name="company"]')
    expect(honeypot).toBeInTheDocument()
    expect(honeypot).toHaveAttribute("tabIndex", "-1")
    expect(honeypot).toHaveAttribute("aria-hidden", "true")
    expect(honeypot).toHaveAttribute("autoComplete", "off")

    // Should not be in the tab order / not queryable by role
    expect(
      screen.queryByRole("textbox", { name: /leave this field empty/i })
    ).not.toBeInTheDocument()
  })
})
