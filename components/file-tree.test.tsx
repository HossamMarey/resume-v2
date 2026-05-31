import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import type { SourceTreeItem } from "@/components/file-tree"

import { FileTree } from "@/components/file-tree"

const items: SourceTreeItem[] = [
  { id: "resume", label: "resume.pdf", type: "file" },
  { id: "articles", label: "articles/", type: "folder", comingSoon: true },
  { id: "talks", label: "talks/", type: "folder", comingSoon: true },
  { id: "contact", label: "contact.ts", type: "file" },
]

describe("FileTree", () => {
  it("renders all 4 items by label", () => {
    render(<FileTree items={items} selectedId="resume" onSelect={vi.fn()} />)

    for (const item of items) {
      expect(screen.getByText(item.label)).toBeInTheDocument()
    }
  })

  it("calls onSelect when clicking an item", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(<FileTree items={items} selectedId="resume" onSelect={onSelect} />)

    await user.click(screen.getByText("contact.ts"))
    expect(onSelect).toHaveBeenCalledWith("contact")
  })

  it("marks the selected item with aria-selected true", () => {
    render(<FileTree items={items} selectedId="articles" onSelect={vi.fn()} />)

    const treeItems = screen.getAllByRole("treeitem")
    expect(treeItems).toHaveLength(4)

    const selected = treeItems.find(
      (el) => el.getAttribute("aria-selected") === "true"
    )
    expect(selected).toHaveTextContent("articles/")
  })

  it("moves selection on ArrowDown key", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(<FileTree items={items} selectedId="resume" onSelect={onSelect} />)

    const resumeButton = screen
      .getByRole("tree")
      .querySelector<HTMLElement>('[aria-selected="true"]')

    resumeButton?.focus()
    await user.keyboard("{ArrowDown}")

    expect(onSelect).toHaveBeenCalledWith("articles")
  })

  it("moves selection on ArrowUp key", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(<FileTree items={items} selectedId="talks" onSelect={onSelect} />)

    const talksButton = screen
      .getByRole("tree")
      .querySelector<HTMLElement>('[aria-selected="true"]')

    talksButton?.focus()
    await user.keyboard("{ArrowUp}")

    expect(onSelect).toHaveBeenCalledWith("articles")
  })

  it("does not move selection past the last item on ArrowDown", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(<FileTree items={items} selectedId="contact" onSelect={onSelect} />)

    const contactButton = screen
      .getByRole("tree")
      .querySelector<HTMLElement>('[aria-selected="true"]')

    contactButton?.focus()
    await user.keyboard("{ArrowDown}")

    expect(onSelect).not.toHaveBeenCalled()
  })

  it("does not move selection past the first item on ArrowUp", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(<FileTree items={items} selectedId="resume" onSelect={onSelect} />)

    const resumeButton = screen
      .getByRole("tree")
      .querySelector<HTMLElement>('[aria-selected="true"]')

    resumeButton?.focus()
    await user.keyboard("{ArrowUp}")

    expect(onSelect).not.toHaveBeenCalled()
  })

  it("does not introduce a level-1 heading", () => {
    render(<FileTree items={items} selectedId="resume" onSelect={vi.fn()} />)
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
  })

  it("renders a tree with aria-label", () => {
    render(<FileTree items={items} selectedId="resume" onSelect={vi.fn()} />)
    expect(
      screen.getByRole("navigation", { name: "Sources file tree" })
    ).toBeInTheDocument()
  })

  it("gives the selected item tabIndex 0 and others tabIndex -1", () => {
    render(<FileTree items={items} selectedId="resume" onSelect={vi.fn()} />)

    const buttons = screen.getAllByRole("treeitem")
    expect(buttons[0]).toHaveAttribute("tabindex", "0")
    for (let i = 1; i < buttons.length; i++) {
      expect(buttons[i]).toHaveAttribute("tabindex", "-1")
    }
  })
})
