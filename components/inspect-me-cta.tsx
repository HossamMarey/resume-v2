"use client"

import { useRef, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { openCommandPalette } from "@/lib/command-palette/bus"
import { useShouldAnimate } from "@/hooks/use-should-animate"
import { cn } from "@/lib/utils"

const subscribe = () => () => {}
const getModifier = () =>
  /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘" : "Ctrl "
const getServerModifier = () => "⌘"

export function InspectMeCta() {
  const hintRef = useRef<HTMLDivElement>(null)
  const shouldAnimate = useShouldAnimate()
  const modifier = useSyncExternalStore(
    subscribe,
    getModifier,
    getServerModifier
  )

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <Button
        variant="outline"
        size="lg"
        onClick={() => openCommandPalette(() => hintRef.current?.focus())}
        className={cn(
          "border-lime/50 bg-lime/10 text-lime hover:bg-lime hover:text-lime-foreground",
          "dark:bg-lime/10 dark:hover:bg-lime",
          shouldAnimate &&
            "transition-transform duration-300 hover:scale-[1.02]"
        )}
      >
        Inspect me
      </Button>

      <div
        ref={hintRef}
        tabIndex={-1}
        className={cn(
          "rounded border border-hairline px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground",
          "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        )}
      >
        <span className="me-1">{modifier}</span>K
      </div>
    </div>
  )
}
