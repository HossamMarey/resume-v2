import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { ConsoleREPL } from "./console-repl"

describe("ConsoleREPL", () => {
  const setup = () => {
    return {
      user: userEvent.setup(),
    }
  }

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

    expect(screen.getByText(/hello/)).toBeInTheDocument()
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
})
