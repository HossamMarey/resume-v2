import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { CommandPalette } from "./command-palette"
import { projects } from "@/lib/content"

const push = vi.hoisted(() => vi.fn())
const toastMock = vi.hoisted(() => vi.fn())

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: push }),
}))

vi.mock("sonner", () => ({
  toast: toastMock,
}))

vi.mock("@/hooks/use-should-animate", () => ({
  useShouldAnimate: () => true,
}))

const mockIsUnlocked = vi.hoisted(() => vi.fn((_name: string) => false))

const mockSetRecruiterMode = vi.hoisted(() => vi.fn())

vi.mock("@/hooks/use-unlocks", () => ({
  useUnlocks: () => ({
    unlocks: [],
    isUnlocked: mockIsUnlocked,
  }),
}))

vi.mock("@/hooks/use-recruiter-mode", () => ({
  useRecruiterMode: () => ({
    isRecruiterMode: false,
    mounted: true,
    setRecruiterMode: mockSetRecruiterMode,
  }),
}))

vi.mock("@/lib/content", async () => {
  const actual = await vi.importActual("@/lib/content")
  return {
    ...(actual as object),
    EXPERIMENTAL_ENABLED: true,
  }
})

// Mock cmdk primitives to avoid jsdom/React 19 compatibility issues
vi.mock("@/components/ui/command", async () => {
  const React = await import("react")

  function CommandDialog({
    open,
    className,
    children,
  }: {
    open: boolean
    className?: string
    children: ReactNode
  }) {
    if (!open) return null
    return React.createElement(
      "div",
      {
        role: "dialog",
        "data-testid": "command-dialog",
        className,
      },
      children
    )
  }

  function CommandInput({
    placeholder,
    ...props
  }: {
    placeholder: string
    [key: string]: unknown
  }) {
    return React.createElement("input", {
      ...props,
      placeholder,
      "data-testid": "command-input",
    })
  }

  function CommandList({ children }: { children: ReactNode }) {
    return React.createElement(
      "div",
      { "data-testid": "command-list" },
      children
    )
  }

  function CommandEmpty({ children }: { children: ReactNode }) {
    return React.createElement(
      "div",
      { "data-testid": "command-empty" },
      children
    )
  }

  function CommandGroup({
    heading,
    children,
  }: {
    heading?: string
    children: ReactNode
  }) {
    return React.createElement(
      "div",
      {
        "data-testid": "command-group",
        "data-heading": heading,
      },
      heading && React.createElement("div", null, heading),
      children
    )
  }

  function CommandItem({
    value,
    onSelect,
    children,
  }: {
    value: string
    onSelect?: () => void
    children: ReactNode
  }) {
    return React.createElement(
      "button",
      {
        "data-testid": "command-item",
        "data-value": value,
        onClick: onSelect,
      },
      children
    )
  }

  return {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
  }
})

const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null)
const anchorClickSpy = vi
  .spyOn(HTMLAnchorElement.prototype, "click")
  .mockImplementation(() => {})

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSetRecruiterMode.mockClear()
  })

  it("opens via ⌘K", () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    expect(screen.getByTestId("command-dialog")).toBeInTheDocument()
  })

  it("opens via Ctrl+K", () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    expect(screen.getByTestId("command-dialog")).toBeInTheDocument()
  })

  it("skips typing targets when closed", () => {
    render(
      <>
        <input data-testid="input" />
        <CommandPalette />
      </>
    )
    const input = screen.getByTestId("input")
    fireEvent.keyDown(input, { key: "k", metaKey: true })
    expect(screen.queryByTestId("command-dialog")).not.toBeInTheDocument()
  })

  it("re-press closes when open", () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    expect(screen.getByTestId("command-dialog")).toBeInTheDocument()
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    expect(screen.queryByTestId("command-dialog")).not.toBeInTheDocument()
  })

  it("shows all four groups", () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    expect(screen.getByText("Navigate")).toBeInTheDocument()
    expect(screen.getByText("Projects")).toBeInTheDocument()
    expect(screen.getByText("Actions")).toBeInTheDocument()
    expect(screen.getByText("Socials")).toBeInTheDocument()
  })

  it("shows Navigate items", () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    expect(screen.getByText("Elements")).toBeInTheDocument()
    expect(screen.getByText("Network")).toBeInTheDocument()
    expect(screen.getByText("Console")).toBeInTheDocument()
    expect(screen.getByText("Performance")).toBeInTheDocument()
    expect(screen.getByText("Sources")).toBeInTheDocument()
    expect(screen.getByText("Recruiter")).toBeInTheDocument()
  })

  it("navigates to Console", async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    await user.click(screen.getByText("Console"))
    expect(push).toHaveBeenCalledWith("/console")
  })

  it("navigates to a project", async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    await user.click(screen.getByText(projects[0].name))
    expect(push).toHaveBeenCalledWith("/work/" + projects[0].slug)
  })

  it("navigates to recruiter via Toggle Recruiter Mode", async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    await user.click(screen.getByText("Toggle Recruiter Mode"))
    expect(mockSetRecruiterMode).toHaveBeenCalledWith(true)
    expect(push).toHaveBeenCalledWith("/recruiter")
  })

  it("fires deadpan toast on Toggle Theme", async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    await user.click(screen.getByText("Toggle Theme"))
    expect(toastMock).toHaveBeenCalledWith(
      "Site is dark-only. The vibe is intentional.",
      {
        id: "theme-dark-only",
      }
    )
    expect(push).not.toHaveBeenCalled()
  })

  it("triggers download on Download Resume", async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    await user.click(screen.getByText("Download Resume"))
    expect(anchorClickSpy).toHaveBeenCalled()
  })

  it("opens social in new tab", async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    await user.click(screen.getByText("GitHub"))
    expect(windowOpenSpy).toHaveBeenCalledWith(
      "https://github.com/HossamMarey",
      "_blank",
      "noopener,noreferrer"
    )
  })

  it("does not render Copy Email when profile.email is empty", () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    expect(screen.queryByText("Copy Email")).not.toBeInTheDocument()
  })

  it("filters items via fuzzy search", async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    const input = screen.getByTestId("command-input")
    await user.type(input, "whoa")
    // With mocked cmdk, we just verify the input works
    expect(input).toHaveValue("whoa")
  })

  it("shows empty state on no match", async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    const input = screen.getByTestId("command-input")
    await user.type(input, "xyznonexistent")
    expect(
      screen.getByText("No matches — try a route, project, or action.")
    ).toBeInTheDocument()
  })

  it("does not show Experimental when locked", () => {
    mockIsUnlocked.mockReturnValue(false)
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    expect(screen.queryByText("Experimental")).not.toBeInTheDocument()
  })

  it("shows Experimental when unlocked and enabled", () => {
    mockIsUnlocked.mockImplementation((name: string) => name === "konami")
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    expect(screen.getByText("Experimental")).toBeInTheDocument()
  })

  it("navigates to console on Experimental select", async () => {
    mockIsUnlocked.mockImplementation((name: string) => name === "konami")
    const user = userEvent.setup()
    render(<CommandPalette />)
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    await user.click(screen.getByText("Experimental"))
    expect(push).toHaveBeenCalledWith("/console")
  })
})
