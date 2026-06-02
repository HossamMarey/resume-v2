import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { BossLevelContactForm } from "@/components/boss-level-contact-form"

vi.mock("@/hooks/use-should-animate", () => ({
  useShouldAnimate: () => false,
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock("@/lib/xp/bus", () => ({
  emitXP: vi.fn(),
}))

import { emitXP } from "@/lib/xp/bus"
import { toast } from "sonner"

async function revealAllFields(user: ReturnType<typeof userEvent.setup>) {
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
  await user.type(messageInput, "This is a test message with enough chars.")
}

describe("BossLevelContactForm", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
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

    // Reveal all fields manually
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

  it("shows submit button after message is revealed", async () => {
    const user = userEvent.setup()
    render(<BossLevelContactForm />)

    await revealAllFields(user)

    const submitButton = screen.getByRole("button", { name: /send/i })
    expect(submitButton).toBeInTheDocument()
  })

  it("renders honeypot input with correct a11y attributes", () => {
    const { container } = render(<BossLevelContactForm />)

    const honeypot = container.querySelector('input[name="company"]')
    expect(honeypot).toBeInTheDocument()
    expect(honeypot).toHaveAttribute("tabIndex", "-1")
    expect(honeypot).toHaveAttribute("aria-hidden", "true")
    expect(honeypot).toHaveAttribute("autoComplete", "off")

    expect(
      screen.queryByRole("textbox", { name: /leave this field empty/i })
    ).not.toBeInTheDocument()
  })

  describe("validation-as-tests", () => {
    it("shows ✓ for valid field after debounce", async () => {
      const user = userEvent.setup()
      render(<BossLevelContactForm />)

      const nameInput = screen.getByRole("textbox", { name: /who's asking/i })
      await user.type(nameInput, "Ada")

      await waitFor(
        () => {
          expect(screen.getByText(/✓ name/)).toBeInTheDocument()
        },
        { timeout: 300 }
      )
    })

    it("shows ✗ for invalid field after debounce", async () => {
      const user = userEvent.setup()
      render(<BossLevelContactForm />)

      const nameInput = screen.getByRole("textbox", { name: /who's asking/i })
      await user.type(nameInput, "A")

      await waitFor(
        () => {
          expect(screen.getByText(/✗ name —/)).toBeInTheDocument()
        },
        { timeout: 300 }
      )
    })

    it("shows ✓ subject when empty", async () => {
      const user = userEvent.setup()
      render(<BossLevelContactForm />)

      const nameInput = screen.getByRole("textbox", { name: /who's asking/i })
      await user.type(nameInput, "Ada")
      await user.keyboard("{Enter}")

      const emailInput = screen.getByRole("textbox", {
        name: /where do I reply/i,
      })
      await user.type(emailInput, "ada@example.com")
      await user.keyboard("{Enter}")

      await waitFor(
        () => {
          expect(screen.getByText(/✓ subject/)).toBeInTheDocument()
        },
        { timeout: 300 }
      )
    })
  })

  describe("submit gating", () => {
    it("disables submit when form is invalid", async () => {
      const user = userEvent.setup()
      render(<BossLevelContactForm />)

      await revealAllFields(user)

      // Clear message and type a short (invalid) one
      const messageInput = screen.getByRole("textbox", { name: /your move/i })
      await user.clear(messageInput)
      await user.type(messageInput, "short")

      await waitFor(
        () => {
          const submitButton = screen.getByRole("button", { name: /send/i })
          expect(submitButton).toBeDisabled()
        },
        { timeout: 300 }
      )
    })

    it("enables submit when whole form is valid", async () => {
      const user = userEvent.setup()
      render(<BossLevelContactForm />)

      await revealAllFields(user)

      await waitFor(
        () => {
          const submitButton = screen.getByRole("button", { name: /send/i })
          expect(submitButton).toBeEnabled()
        },
        { timeout: 300 }
      )
    })
  })

  describe("live submit lifecycle", () => {
    it("calls fetch with correct body on submit", async () => {
      const fetchMock = vi.fn(
        async (_input: RequestInfo | URL, _init?: RequestInit) =>
          Response.json({ ok: true }, { status: 200 })
      )
      vi.stubGlobal("fetch", fetchMock)

      const user = userEvent.setup()
      render(<BossLevelContactForm />)

      await revealAllFields(user)

      await waitFor(
        () => {
          const submitButton = screen.getByRole("button", { name: /send/i })
          expect(submitButton).toBeEnabled()
        },
        { timeout: 300 }
      )

      const submitButton = screen.getByRole("button", { name: /send/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("company"),
        })
      })

      const call = fetchMock.mock.calls[0]
      const requestInit = call[1] as unknown as { body: string }
      const body = JSON.parse(requestInit.body)
      expect(body).toMatchObject({
        name: "Ada",
        email: "ada@example.com",
        subject: "Hello",
        message: "This is a test message with enough chars.",
        company: "",
        renderedAt: expect.any(Number),
      })
    })

    it("shows success toast and emits XP on ok response", async () => {
      const fetchMock = vi.fn(async () =>
        Response.json({ ok: true }, { status: 200 })
      )
      vi.stubGlobal("fetch", fetchMock)

      const user = userEvent.setup()
      render(<BossLevelContactForm />)

      await revealAllFields(user)

      await waitFor(
        () => {
          const submitButton = screen.getByRole("button", { name: /send/i })
          expect(submitButton).toBeEnabled()
        },
        { timeout: 300 }
      )

      const submitButton = screen.getByRole("button", { name: /send/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "hm@portfolio: message queued. response window: 2 business days."
        )
      })

      expect(emitXP).toHaveBeenCalledWith(50, "contact:submit")

      expect(
        screen.getByRole("textbox", { name: /who's asking/i })
      ).toHaveValue("")

      expect(
        screen.queryByRole("textbox", { name: /where do I reply/i })
      ).not.toBeInTheDocument()

      expect(screen.getByText(/transmission received/i)).toBeInTheDocument()
    })

    it("shows error toast and no XP on non-ok response", async () => {
      const fetchMock = vi.fn(async () =>
        Response.json({ ok: false }, { status: 500 })
      )
      vi.stubGlobal("fetch", fetchMock)

      const user = userEvent.setup()
      render(<BossLevelContactForm />)

      await revealAllFields(user)

      await waitFor(
        () => {
          const submitButton = screen.getByRole("button", { name: /send/i })
          expect(submitButton).toBeEnabled()
        },
        { timeout: 300 }
      )

      const submitButton = screen.getByRole("button", { name: /send/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "hm@portfolio: delivery failed. retry, or email hosmarey@gmail.com directly."
        )
      })

      expect(emitXP).not.toHaveBeenCalled()
    })

    it("shows rate-limited toast on 429", async () => {
      const fetchMock = vi.fn(async () =>
        Response.json({ ok: false, error: "rate limited" }, { status: 429 })
      )
      vi.stubGlobal("fetch", fetchMock)

      const user = userEvent.setup()
      render(<BossLevelContactForm />)

      await revealAllFields(user)

      await waitFor(
        () => {
          const submitButton = screen.getByRole("button", { name: /send/i })
          expect(submitButton).toBeEnabled()
        },
        { timeout: 300 }
      )

      const submitButton = screen.getByRole("button", { name: /send/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "hm@portfolio: too many attempts. cool down and retry shortly."
        )
      })

      expect(emitXP).not.toHaveBeenCalled()
    })

    it("shows error toast and no XP on network throw", async () => {
      const fetchMock = vi.fn(async () => {
        throw new Error("network error")
      })
      vi.stubGlobal("fetch", fetchMock)

      const user = userEvent.setup()
      render(<BossLevelContactForm />)

      await revealAllFields(user)

      await waitFor(
        () => {
          const submitButton = screen.getByRole("button", { name: /send/i })
          expect(submitButton).toBeEnabled()
        },
        { timeout: 300 }
      )

      const submitButton = screen.getByRole("button", { name: /send/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "hm@portfolio: delivery failed. retry, or email hosmarey@gmail.com directly."
        )
      })

      expect(emitXP).not.toHaveBeenCalled()
    })

    it("shows 'running tests…' while in flight", async () => {
      let resolveFetch: (value: Response) => void
      const fetchMock = vi.fn(
        async () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve
          })
      )
      vi.stubGlobal("fetch", fetchMock)

      const user = userEvent.setup()
      render(<BossLevelContactForm />)

      await revealAllFields(user)

      await waitFor(
        () => {
          const submitButton = screen.getByRole("button", { name: /send/i })
          expect(submitButton).toBeEnabled()
        },
        { timeout: 300 }
      )

      const submitButton = screen.getByRole("button", { name: /send/i })
      await user.click(submitButton)

      expect(screen.getByText("running tests…")).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      resolveFetch!(Response.json({ ok: true }, { status: 200 }))

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /send/i })
        ).not.toBeInTheDocument()
      })
    })
  })
})
