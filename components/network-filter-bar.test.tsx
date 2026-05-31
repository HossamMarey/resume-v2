import React from "react"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { NetworkFilterBar } from "@/components/network-filter-bar"

import type {
  ActiveFilters,
  AvailableFilters,
} from "@/components/network-filter-bar"

const defaultAvailable: AvailableFilters = {
  method: ["GET", "POST", "PUT"],
  status: ["shipped", "ongoing"],
  year: ["2024", "2023"],
}

const noFilters: ActiveFilters = {
  method: [],
  status: [],
  year: [],
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
    expect(screen.getByRole("button", { name: /method/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /status/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /year/i })).toBeInTheDocument()
  })

  it("shows active count on chips when filters are selected", () => {
    const active: ActiveFilters = {
      method: ["GET", "POST"],
      status: [],
      year: [],
    }
    render(
      <NetworkFilterBar
        availableFilters={defaultAvailable}
        activeFilters={active}
        onToggle={vi.fn()}
        onClear={vi.fn()}
      />
    )
    const methodBtn = screen.getByRole("button", { name: /method/i })
    expect(methodBtn).toHaveTextContent("Method")
    expect(methodBtn).toHaveTextContent("2")
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
    await user.click(screen.getByRole("button", { name: /method/i }))
    expect(screen.getByLabelText("GET")).toBeInTheDocument()
    expect(screen.getByLabelText("POST")).toBeInTheDocument()
    expect(screen.getByLabelText("PUT")).toBeInTheDocument()
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
    await user.click(screen.getByRole("button", { name: /status/i }))
    await user.click(screen.getByLabelText("shipped"))
    expect(onToggle).toHaveBeenCalledWith("status", "shipped")
  })

  it('shows "Clear all" button when filters are active', () => {
    const active: ActiveFilters = {
      method: ["GET"],
      status: [],
      year: [],
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
      method: ["GET"],
      status: [],
      year: [],
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
