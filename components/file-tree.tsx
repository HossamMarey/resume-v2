"use client"

import { useCallback, useRef } from "react"

import { cn } from "@/lib/utils"
import { FileText, Folder, FolderOpen } from "lucide-react"

export interface SourceTreeItem {
  id: string
  label: string
  type: "file" | "folder"
  comingSoon?: boolean
}

interface FileTreeProps {
  items: SourceTreeItem[]
  selectedId: string
  onSelect: (id: string) => void
}

export function FileTree({ items, selectedId, onSelect }: FileTreeProps) {
  const listRef = useRef<HTMLUListElement>(null)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = items.findIndex((item) => item.id === selectedId)
      let nextIndex = currentIndex

      if (e.key === "ArrowDown") {
        e.preventDefault()
        nextIndex = Math.min(currentIndex + 1, items.length - 1)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        nextIndex = Math.max(currentIndex - 1, 0)
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        if (items.length > 0) {
          onSelect(selectedId)
        }
        return
      } else {
        return
      }

      const nextItem = items[nextIndex]
      if (nextItem && nextItem.id !== selectedId) {
        onSelect(nextItem.id)
      }

      const listEl = listRef.current
      if (listEl) {
        const treeItems =
          listEl.querySelectorAll<HTMLElement>('[role="treeitem"]')
        treeItems[nextIndex]?.focus()
      }
    },
    [items, selectedId, onSelect]
  )

  return (
    <nav aria-label="Sources file tree" className="w-full md:w-[220px]">
      <ul
        ref={listRef}
        role="tree"
        className="flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => {
          const isSelected = selectedId === item.id
          const Icon =
            item.type === "folder"
              ? isSelected
                ? FolderOpen
                : Folder
              : FileText

          return (
            <li
              key={item.id}
              role="treeitem"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={(e) => {
                onSelect(item.id)
                ;(e.currentTarget as HTMLElement).focus()
              }}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-2 font-mono text-sm",
                "min-h-[44px] md:min-h-0",
                "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
                isSelected
                  ? "border-s-2 border-lime bg-surface text-foreground"
                  : "border-s-2 border-transparent text-muted-foreground hover:bg-surface/50"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
