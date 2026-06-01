import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ConsoleREPL } from "./console-repl"

const mockPush = vi.hoisted(() => vi.fn())
const mockEmitXP = vi.hoisted(() => vi.fn())

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/lib/xp/bus", () => ({
  emitXP: mockEmitXP,
}))

const mockUseUnlocks = vi.hoisted(() =>
  vi.fn(() => ({ unlocks: [] as string[] }))
)

vi.mock("@/hooks/use-unlocks", () => ({
  useUnlocks: mockUseUnlocks,
}))

describe("ConsoleREPL", () => {
  const setup = () => {
    return {
      user: userEvent.setup(),
    }
  }

  beforeEach(() => {
    mockPush.mockClear()
    mockEmitXP.mockClear()
  })

  it("auto-focuses the input on mount", async () => {
    render(<ConsoleREPL />)
    const input = screen.getByRole("textbox", { name: /console input/i })
    expect(input).toHaveFocus()
  })

  it("echoes submitted command and clears input", async () => {
    const { user } = setup()
    render(<ConsoleREPL />)

    const input = screen.getByRole("textbox", { name: /console input/i })
    await user.type(input, "hello")
    await user.keyboard("{Enter}")

    const echoedLine = screen.getByText((content, element) => {
      return element?.tagName === "DIV" && content === "hello"
    })
    expect(echoedLine).toBeInTheDocument()
    expect(input).toHaveValue("")
  })

  it("ignores empty or whitespace-only submits", async () => {
    const { user } = setup()
    render(<ConsoleREPL />)

    const input = screen.getByRole("textbox", { name: /console input/i })
    await user.type(input, "   ")
    await user.keyboard("{Enter}")

    expect(screen.queryAllByRole("log")).toHaveLength(1)
    expect(screen.queryByText(/\$\s+$/)).not.toBeInTheDocument()
  })

  it("walks history with arrow keys and clamps", async () => {
    const { user } = setup()
    render(<ConsoleREPL />)

    const input = screen.getByRole("textbox", { name: /console input/i })

    await user.type(input, "first")
    await user.keyboard("{Enter}")

    await user.type(input, "second")
    await user.keyboard("{Enter}")

    await user.type(input, "third")

    await user.keyboard("{ArrowUp}")
    expect(input).toHaveValue("second")

    await user.keyboard("{ArrowUp}")
    expect(input).toHaveValue("first")

    await user.keyboard("{ArrowUp}")
    expect(input).toHaveValue("first")

    await user.keyboard("{ArrowUp}")
    expect(input).toHaveValue("first")

    await user.keyboard("{ArrowDown}")
    expect(input).toHaveValue("second")

    await user.keyboard("{ArrowDown}")
    expect(input).toHaveValue("third")

    await user.keyboard("{ArrowDown}")
    expect(input).toHaveValue("third")

    await user.keyboard("{ArrowDown}")
    expect(input).toHaveValue("third")
  })

  it("handles multiline paste: first line only + notice", async () => {
    const { user } = setup()
    render(<ConsoleREPL />)

    const input = screen.getByRole("textbox", { name: /console input/i })
    await user.click(input)
    await user.paste("a\nb\nc")

    expect(input).toHaveValue("a")
    expect(
      screen.getByText(/pasted 2 additional line\(s\) ignored/)
    ).toBeInTheDocument()
  })

  it("does not show notice for single-line paste", async () => {
    const { user } = setup()
    render(<ConsoleREPL />)

    const input = screen.getByRole("textbox", { name: /console input/i })
    await user.click(input)
    await user.paste("single")

    expect(input).toHaveValue("single")
    expect(
      screen.queryByText(/additional line\(s\) ignored/)
    ).not.toBeInTheDocument()
  })

  it("mobile buttons share the same history cursor", async () => {
    const { user } = setup()
    render(<ConsoleREPL />)

    const input = screen.getByRole("textbox", { name: /console input/i })

    await user.type(input, "command one")
    await user.keyboard("{Enter}")

    await user.type(input, "command two")
    await user.keyboard("{Enter}")

    const prevButton = screen.getByRole("button", {
      name: /previous command/i,
    })
    const nextButton = screen.getByRole("button", { name: /next command/i })

    await user.click(prevButton)
    expect(input).toHaveValue("command two")

    await user.click(prevButton)
    expect(input).toHaveValue("command one")

    await user.click(nextButton)
    expect(input).toHaveValue("command two")

    await user.click(nextButton)
    expect(input).toHaveValue("")
  })

  it("has aria-live polite on transcript", () => {
    render(<ConsoleREPL />)
    const transcript = screen.getByRole("log")
    expect(transcript).toHaveAttribute("aria-live", "polite")
  })

  it("uses a real input, not contenteditable", () => {
    render(<ConsoleREPL />)
    const input = screen.getByRole("textbox", { name: /console input/i })
    expect(input.tagName).toBe("INPUT")
  })

  describe("registry integration", () => {
    it("renders voiced output for whoami", async () => {
      const { user } = setup()
      render(<ConsoleREPL />)

      const input = screen.getByRole("textbox", { name: /console input/i })
      await user.type(input, "whoami")
      await user.keyboard("{Enter}")

      const echoedLine = screen.getByText((content, element) => {
        return element?.tagName === "DIV" && content === "whoami"
      })
      expect(echoedLine).toBeInTheDocument()
      expect(screen.getByText(/Hossam Marey/)).toBeInTheDocument()
    })

    it("renders command not found for unknown commands", async () => {
      const { user } = setup()
      render(<ConsoleREPL />)

      const input = screen.getByRole("textbox", { name: /console input/i })
      await user.type(input, "xyzzy")
      await user.keyboard("{Enter}")

      expect(screen.getByText(/command not found: xyzzy/)).toBeInTheDocument()
    })

    it("renders did you mean for near-miss commands", async () => {
      const { user } = setup()
      render(<ConsoleREPL />)

      const input = screen.getByRole("textbox", { name: /console input/i })
      await user.type(input, "whoam")
      await user.keyboard("{Enter}")

      expect(screen.getByText(/did you mean: whoami\?/)).toBeInTheDocument()
    })

    it("clears transcript but preserves history", async () => {
      const { user } = setup()
      render(<ConsoleREPL />)

      const input = screen.getByRole("textbox", { name: /console input/i })

      await user.type(input, "hello")
      await user.keyboard("{Enter}")

      await user.type(input, "clear")
      await user.keyboard("{Enter}")

      const transcript = screen.getByRole("log")
      expect(transcript.children).toHaveLength(0)

      // History still works
      await user.keyboard("{ArrowUp}")
      expect(input).toHaveValue("clear")

      await user.keyboard("{ArrowUp}")
      expect(input).toHaveValue("hello")
    })

    it("emits XP on successful command", async () => {
      const { user } = setup()
      render(<ConsoleREPL />)

      const input = screen.getByRole("textbox", { name: /console input/i })
      await user.type(input, "help")
      await user.keyboard("{Enter}")

      expect(mockEmitXP).toHaveBeenCalledWith(5, "repl:command")
    })

    it("does not emit XP on command not found", async () => {
      const { user } = setup()
      render(<ConsoleREPL />)

      const input = screen.getByRole("textbox", { name: /console input/i })
      await user.type(input, "nope")
      await user.keyboard("{Enter}")

      expect(mockEmitXP).not.toHaveBeenCalled()
    })

    it("passes unlocks to runCommand", async () => {
      mockUseUnlocks.mockReturnValue({ unlocks: ["konami"] })
      const { user } = setup()
      render(<ConsoleREPL />)

      const input = screen.getByRole("textbox", { name: /console input/i })
      await user.type(input, "experimental")
      await user.keyboard("{Enter}")

      // With EXPERIMENTAL_ENABLED false in the real module, experimental
      // should still be command-not-found even when unlocked.
      expect(
        screen.getByText(/command not found: experimental/)
      ).toBeInTheDocument()
    })

    it("navigates on contact command", async () => {
      const { user } = setup()
      render(<ConsoleREPL />)

      const input = screen.getByRole("textbox", { name: /console input/i })
      await user.type(input, "contact")
      await user.keyboard("{Enter}")

      expect(mockPush).toHaveBeenCalledWith("/sources")
    })

    it("triggers download on download resume", async () => {
      const { user } = setup()
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click")
      render(<ConsoleREPL />)

      const input = screen.getByRole("textbox", { name: /console input/i })
      await user.type(input, "download resume")
      await user.keyboard("{Enter}")

      expect(clickSpy).toHaveBeenCalled()
      clickSpy.mockRestore()
    })
  })
})
