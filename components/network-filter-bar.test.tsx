import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { NetworkFilterBar } from "@/components/network-filter-bar"

import type {
  ActiveFilters,
  AvailableFilters,
} from "@/components/network-filter-bar"

const defaultAvailable: AvailableFilters = {
  type: ["web", "app", "lib"],
  stack: ["react", "vue"],
  org: ["Acme Inc"],
}

const noFilters: ActiveFilters = {
  type: [],
  stack: [],
  org: [],
}

describe("NetworkFilterBar", () => {
  it("renders a chip for each filter category", () => {
    render(
      <NetworkFilterBar
        availableFilters={defaultAvailable}
        activeFilters={noFilters}
        onToggle={vi.fn()}
        onClear={vi.fn()}
      />
    )
    expect(screen.getByRole("button", { name: /type/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /stack/i })).toBeInTheDocument()
  })

  it("shows active count on chips when filters are selected", () => {
    const active: ActiveFilters = {
      type: ["web", "app"],
      stack: [],
      org: [],
    }
    render(
      <NetworkFilterBar
        availableFilters={defaultAvailable}
        activeFilters={active}
        onToggle={vi.fn()}
        onClear={vi.fn()}
      />
    )
    const typeBtn = screen.getByRole("button", { name: /type/i })
    expect(typeBtn).toHaveTextContent("Type")
    expect(typeBtn).toHaveTextContent("2")
  })

  it("opens a popover with checkboxes on chip click", async () => {
    const user = userEvent.setup()
    render(
      <NetworkFilterBar
        availableFilters={defaultAvailable}
        activeFilters={noFilters}
        onToggle={vi.fn()}
        onClear={vi.fn()}
      />
    )
    await user.click(screen.getByRole("button", { name: /type/i }))
    expect(screen.getByLabelText("web")).toBeInTheDocument()
    expect(screen.getByLabelText("app")).toBeInTheDocument()
    expect(screen.getByLabelText("lib")).toBeInTheDocument()
  })

  it("calls onToggle when a checkbox is toggled", async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(
      <NetworkFilterBar
        availableFilters={defaultAvailable}
        activeFilters={noFilters}
        onToggle={onToggle}
        onClear={vi.fn()}
      />
    )
    await user.click(screen.getByRole("button", { name: /stack/i }))
    await user.click(screen.getByLabelText("react"))
    expect(onToggle).toHaveBeenCalledWith("stack", "react")
  })

  it('shows "Clear all" button when filters are active', () => {
    const active: ActiveFilters = {
      type: ["web"],
      stack: [],
      org: [],
    }
    render(
      <NetworkFilterBar
        availableFilters={defaultAvailable}
        activeFilters={active}
        onToggle={vi.fn()}
        onClear={vi.fn()}
      />
    )
    expect(
      screen.getByRole("button", { name: /clear all/i })
    ).toBeInTheDocument()
  })

  it('does not show "Clear all" when no filters are active', () => {
    render(
      <NetworkFilterBar
        availableFilters={defaultAvailable}
        activeFilters={noFilters}
        onToggle={vi.fn()}
        onClear={vi.fn()}
      />
    )
    expect(
      screen.queryByRole("button", { name: /clear all/i })
    ).not.toBeInTheDocument()
  })

  it("calls onClear when Clear all is clicked", async () => {
    const onClear = vi.fn()
    const user = userEvent.setup()
    const active: ActiveFilters = {
      type: ["web"],
      stack: [],
      org: [],
    }
    render(
      <NetworkFilterBar
        availableFilters={defaultAvailable}
        activeFilters={active}
        onToggle={vi.fn()}
        onClear={onClear}
      />
    )
    await user.click(screen.getByRole("button", { name: /clear all/i }))
    expect(onClear).toHaveBeenCalledOnce()
  })
})
