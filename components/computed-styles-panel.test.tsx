import { render, screen } from "@testing-library/react"

import {
  ComputedStylesCell,
  ComputedStylesPanel,
} from "@/components/computed-styles-panel"

describe("ComputedStylesPanel", () => {
  it("renders its cell children", () => {
    render(
      <ComputedStylesPanel>
        <ComputedStylesCell>display</ComputedStylesCell>
        <ComputedStylesCell>block</ComputedStylesCell>
      </ComputedStylesPanel>
    )
    expect(screen.getByText("display")).toBeInTheDocument()
    expect(screen.getByText("block")).toBeInTheDocument()
  })

  it("defaults to vertical direction", () => {
    const { container } = render(
      <ComputedStylesPanel>cell</ComputedStylesPanel>
    )
    expect(
      container.querySelector('[data-slot="computed-styles-panel"]')
    ).toHaveAttribute("data-direction", "vertical")
  })

  it("applies horizontal direction when requested", () => {
    const { container } = render(
      <ComputedStylesPanel direction="horizontal">cell</ComputedStylesPanel>
    )
    expect(
      container.querySelector('[data-slot="computed-styles-panel"]')
    ).toHaveAttribute("data-direction", "horizontal")
  })
})
