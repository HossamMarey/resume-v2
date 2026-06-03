"use client"

import { useCallback, useRef, useState } from "react"

import { useShouldAnimate } from "@/hooks/use-should-animate"

export type ImageTrailVariant = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface TrailItem {
  id: number
  src: string
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  speed: number
}

const SPAWN_THRESHOLD = 80
const QUEUE_LIMIT = 5
// Safety ceiling so fast sweeps can't mount an unbounded number of images.
const MAX_TRAIL = 16

export interface ImageTrailHandlers {
  onRowEnter: (images: readonly string[]) => void
  onRowMove: (images: readonly string[], event: React.MouseEvent) => void
  onRowLeave: () => void
}

export interface UseImageTrailResult extends ImageTrailHandlers {
  containerRef: React.RefObject<HTMLDivElement | null>
  trail: TrailItem[]
  removeItem: (id: number) => void
}

export function useImageTrail(variant: ImageTrailVariant): UseImageTrailResult {
  const shouldAnimate = useShouldAnimate()
  const isQueue = variant === 7

  const containerRef = useRef<HTMLDivElement | null>(null)
  const idRef = useRef(0)
  const indexRef = useRef(0)
  const lastSpawnRef = useRef<{ x: number; y: number } | null>(null)
  const lastPointRef = useRef<{ x: number; y: number; t: number } | null>(null)

  const [trail, setTrail] = useState<TrailItem[]>([])

  const removeItem = useCallback((id: number) => {
    setTrail((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const onRowEnter = useCallback(
    (images: readonly string[]) => {
      if (!shouldAnimate || images.length === 0) return
      // Force the first move over the row to spawn immediately, and restart
      // this row's image cycle at its first image.
      lastSpawnRef.current = null
      lastPointRef.current = null
      indexRef.current = 0
    },
    [shouldAnimate]
  )

  const onRowMove = useCallback(
    (images: readonly string[], event: React.MouseEvent) => {
      if (!shouldAnimate || images.length === 0) return
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const now = performance.now()

      const last = lastPointRef.current
      let vx = 0
      let vy = 0
      if (last) {
        const dt = Math.max(now - last.t, 1)
        vx = ((x - last.x) / dt) * 16
        vy = ((y - last.y) / dt) * 16
      }
      lastPointRef.current = { x, y, t: now }

      const lastSpawn = lastSpawnRef.current
      const traveled = lastSpawn
        ? Math.hypot(x - lastSpawn.x, y - lastSpawn.y)
        : Infinity
      if (traveled < SPAWN_THRESHOLD) return

      lastSpawnRef.current = { x, y }
      const src = images[indexRef.current % images.length]
      indexRef.current += 1

      const item: TrailItem = {
        id: idRef.current++,
        src,
        x,
        y,
        vx,
        vy,
        angle: (Math.atan2(vy, vx) * 180) / Math.PI,
        speed: Math.hypot(vx, vy),
      }

      setTrail((prev) => {
        const next = [...prev, item]
        const cap = isQueue ? QUEUE_LIMIT : MAX_TRAIL
        if (next.length > cap) {
          return next.slice(next.length - cap)
        }
        return next
      })
    },
    [shouldAnimate, isQueue]
  )

  const onRowLeave = useCallback(() => {
    // Stop spawning; in-flight trail items finish their own exit animation.
    lastSpawnRef.current = null
    lastPointRef.current = null
    // Queue-variant items persist at full opacity until evicted, so clear them
    // on leave to trigger their AnimatePresence exit instead of freezing.
    if (isQueue) setTrail([])
  }, [isQueue])

  return {
    containerRef,
    trail,
    onRowEnter,
    onRowMove,
    onRowLeave,
    removeItem,
  }
}
