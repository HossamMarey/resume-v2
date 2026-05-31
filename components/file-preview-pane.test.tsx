import { render, screen } from "@testing-library/react"

import type { SourceTreeItem } from "@/components/file-tree"

import { FilePreviewPane } from "@/components/file-preview-pane"

describe("FilePreviewPane", () => {
  it("renders an embed with correct src for resume item", () => {
    const item: SourceTreeItem = {
      id: "resume",
      label: "resume.pdf",
      type: "file",
    }
    const { container } = render(<FilePreviewPane item={item} />)

    const embed = container.querySelector("embed")
    expect(embed).toBeInTheDocument()
    expect(embed).toHaveAttribute("src", "/hossam-marey-resume.pdf")
    expect(embed).toHaveAttribute("type", "application/pdf")
  })

  it("renders a download link for resume item", () => {
    const item: SourceTreeItem = {
      id: "resume",
      label: "resume.pdf",
      type: "file",
    }
    render(<FilePreviewPane item={item} />)

    const link = screen.getByText("Download resume.pdf")
    expect(link).toBeInTheDocument()
    expect(link.closest("a")).toHaveAttribute(
      "href",
      "/hossam-marey-resume.pdf"
    )
  })

  it("renders contact stub with ComputedStylesPanel", () => {
    const item: SourceTreeItem = {
      id: "contact",
      label: "contact.ts",
      type: "file",
    }
    render(<FilePreviewPane item={item} />)

    expect(screen.getByText("Contact")).toBeInTheDocument()
    expect(
      screen.getByText("Boss-level contact form coming in Epic 6.")
    ).toBeInTheDocument()
  })

  it("renders coming soon for articles folder", () => {
    const item: SourceTreeItem = {
      id: "articles",
      label: "articles/",
      type: "folder",
      comingSoon: true,
    }
    render(<FilePreviewPane item={item} />)

    expect(screen.getByText(/articles\/ — Coming soon/)).toBeInTheDocument()
  })

  it("renders coming soon for talks folder", () => {
    const item: SourceTreeItem = {
      id: "talks",
      label: "talks/",
      type: "folder",
      comingSoon: true,
    }
    render(<FilePreviewPane item={item} />)

    expect(screen.getByText(/talks\/ — Coming soon/)).toBeInTheDocument()
  })

  it("renders nothing for null item", () => {
    const { container } = render(<FilePreviewPane item={null} />)
    expect(container.querySelector("[aria-live]")).toBeInTheDocument()
    expect(container.querySelector("[aria-live]")?.children.length).toBe(0)
  })

  it("does not introduce a level-1 heading", () => {
    const item: SourceTreeItem = {
      id: "resume",
      label: "resume.pdf",
      type: "file",
    }
    render(<FilePreviewPane item={item} />)
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
  })

  it("has aria-live polite on preview section", () => {
    const item: SourceTreeItem = {
      id: "resume",
      label: "resume.pdf",
      type: "file",
    }
    render(<FilePreviewPane item={item} />)

    const section = screen.getByLabelText("File preview")
    expect(section).toHaveAttribute("aria-live", "polite")
  })
})
