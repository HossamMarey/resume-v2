"use client"

import type { SourceTreeItem } from "@/components/file-tree"

import { BossLevelContactForm } from "@/components/boss-level-contact-form"
import {
  ComputedStylesCell,
  ComputedStylesPanel,
} from "@/components/computed-styles-panel"
import { Download } from "lucide-react"

interface FilePreviewPaneProps {
  item: SourceTreeItem | null
}

export function FilePreviewPane({ item }: FilePreviewPaneProps) {
  return (
    <section
      aria-live="polite"
      aria-label="File preview"
      className="min-w-0 flex-1"
    >
      {!item ? null : item.id === "resume" ? (
        <div className="flex h-full flex-col gap-4">
          <a
            href="/hossam-marey-resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded border border-hairline bg-surface px-4 py-2 font-mono text-sm text-foreground hover:bg-surface/80 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Download className="h-4 w-4" />
            Download resume.pdf
            <span className="sr-only"> (opens in new tab)</span>
          </a>
          <iframe
            src="/hossam-marey-resume.pdf"
            title="Hossam Marey resume PDF"
            className="h-[80vh] min-h-[300px] w-full rounded border border-hairline"
          />
        </div>
      ) : item.id === "contact" ? (
        <BossLevelContactForm />
      ) : (
        <ComputedStylesPanel>
          <ComputedStylesCell>
            <p className="text-muted-foreground">{item.label} — Coming soon</p>
          </ComputedStylesCell>
        </ComputedStylesPanel>
      )}
    </section>
  )
}
