import React from "react"

import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ProjectMediaGallery } from "@/components/project-media-gallery"

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: ({
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"div"> & {
      children?: React.ReactNode
    }) => <div {...props}>{children}</div>,
  },
}))

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill: _f, sizes: _s, ...rest } = props
    void _f
    void _s
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} alt={(rest.alt as string) || ""} />
  },
}))

vi.mock("@/hooks/use-should-animate", () => ({
  useShouldAnimate: () => true,
}))

describe("ProjectMediaGallery", () => {
  it("renders nothing when both arrays are empty", () => {
    const { container } = render(
      <ProjectMediaGallery images={[]} videos={[]} projectName="Test" />
    )
    expect(container.innerHTML).toBe("")
  })

  it("renders image slides", () => {
    render(
      <ProjectMediaGallery
        images={["/img1.jpg", "/img2.jpg"]}
        videos={[]}
        projectName="Test"
      />
    )
    expect(
      screen.getByRole("region", { name: "Test media" })
    ).toBeInTheDocument()
    expect(screen.getByText("1 / 2")).toBeInTheDocument()
  })

  it("renders video slides", () => {
    render(
      <ProjectMediaGallery
        images={[]}
        videos={["https://example.com/video.mp4"]}
        projectName="Test"
      />
    )
    expect(screen.getByRole("region")).toBeInTheDocument()
    const video = screen.getByRole("region").querySelector("video")
    expect(video).toBeInTheDocument()
  })

  it("navigates with ArrowRight and ArrowLeft", () => {
    render(
      <ProjectMediaGallery
        images={["/img1.jpg", "/img2.jpg", "/img3.jpg"]}
        videos={[]}
        projectName="Test"
      />
    )

    const region = screen.getByRole("region")
    fireEvent.keyDown(region, { key: "ArrowRight" })
    expect(screen.getByText("2 / 3")).toBeInTheDocument()

    fireEvent.keyDown(region, { key: "ArrowLeft" })
    expect(screen.getByText("1 / 3")).toBeInTheDocument()
  })

  it("wraps around on navigation", () => {
    render(
      <ProjectMediaGallery
        images={["/img1.jpg", "/img2.jpg"]}
        videos={[]}
        projectName="Test"
      />
    )

    const region = screen.getByRole("region")
    fireEvent.keyDown(region, { key: "ArrowLeft" })
    expect(screen.getByText("2 / 2")).toBeInTheDocument()
  })

  it("renders dot buttons for each slide", () => {
    render(
      <ProjectMediaGallery
        images={["/img1.jpg", "/img2.jpg"]}
        videos={[]}
        projectName="Test"
      />
    )
    expect(screen.getByLabelText("Go to slide 1")).toBeInTheDocument()
    expect(screen.getByLabelText("Go to slide 2")).toBeInTheDocument()
  })

  it("navigates via dot buttons", async () => {
    const user = userEvent.setup()
    render(
      <ProjectMediaGallery
        images={["/img1.jpg", "/img2.jpg"]}
        videos={[]}
        projectName="Test"
      />
    )
    await user.click(screen.getByLabelText("Go to slide 2"))
    expect(screen.getByText("2 / 2")).toBeInTheDocument()
  })

  it("does not render controls for single slide", () => {
    render(
      <ProjectMediaGallery
        images={["/img1.jpg"]}
        videos={[]}
        projectName="Test"
      />
    )
    expect(screen.queryByLabelText("Previous slide")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Next slide")).not.toBeInTheDocument()
    expect(screen.queryByText(/\/ 1/)).not.toBeInTheDocument()
  })
})

describe("ProjectMediaGallery reduced motion", () => {
  beforeAll(() => {
    vi.doMock("@/hooks/use-should-animate", () => ({
      useShouldAnimate: () => false,
    }))
  })

  afterAll(() => {
    vi.doUnmock("@/hooks/use-should-animate")
  })

  it("renders without animation when reduced motion is preferred", () => {
    render(
      <ProjectMediaGallery
        images={["/img1.jpg", "/img2.jpg"]}
        videos={[]}
        projectName="Test"
      />
    )
    expect(screen.getByText("1 / 2")).toBeInTheDocument()
    expect(screen.getByLabelText("Previous slide")).toBeInTheDocument()
    expect(screen.getByLabelText("Next slide")).toBeInTheDocument()
  })
})
