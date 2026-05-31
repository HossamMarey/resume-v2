"use client"

import type { SourceTreeItem } from "@/components/file-tree"

import { useState } from "react"

import { FileTree } from "@/components/file-tree"
import { FilePreviewPane } from "@/components/file-preview-pane"

interface SourcesPanelProps {
  items: SourceTreeItem[]
}

export function SourcesPanel({ items }: SourcesPanelProps) {
  const [selectedId, setSelectedId] = useState("resume")
  const selectedItem = items.find((i) => i.id === selectedId) ?? null

  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-0 md:border-t md:border-hairline">
      <div className="md:border-e md:border-hairline">
        <FileTree
          items={items}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
      <div className="min-w-0 flex-1 md:p-4">
        <FilePreviewPane item={selectedItem} />
      </div>
    </div>
  )
}
