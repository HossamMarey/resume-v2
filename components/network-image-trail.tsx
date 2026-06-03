"use client"

import { createContext, useContext } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"

import { useImageTrail } from "@/hooks/use-image-trail"

import type {
  ImageTrailHandlers,
  ImageTrailVariant,
  TrailItem,
} from "@/hooks/use-image-trail"
import type { HTMLMotionProps } from "framer-motion"

export type { ImageTrailVariant } from "@/hooks/use-image-trail"

const ImageTrailContext = createContext<ImageTrailHandlers | null>(null)

export function useImageTrailHandlers(): ImageTrailHandlers | null {
  return useContext(ImageTrailContext)
}

interface NetworkImageTrailProps {
  variant: ImageTrailVariant
  children: React.ReactNode
}

export function NetworkImageTrail({
  variant,
  children,
}: NetworkImageTrailProps) {
  const { containerRef, trail, onRowEnter, onRowMove, onRowLeave, removeItem } =
    useImageTrail(variant)

  return (
    <ImageTrailContext.Provider value={{ onRowEnter, onRowMove, onRowLeave }}>
      <div ref={containerRef} className="relative">
        {children}
        <div
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          aria-hidden
        >
          <AnimatePresence>
            {trail.map((item) => (
              <ImageTrailItem
                key={item.id}
                item={item}
                variant={variant}
                onDone={() => removeItem(item.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ImageTrailContext.Provider>
  )
}

const TRAIL_WIDTH = 128
const TRAIL_HEIGHT = 80
const LIFE = 0.8

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

interface VariantMotion {
  container: HTMLMotionProps<"div">
  inner: HTMLMotionProps<"div">
}

function getVariantMotion(
  variant: ImageTrailVariant,
  item: TrailItem
): VariantMotion {
  const fade = {
    initial: { scale: 0, opacity: 1 },
    animate: { scale: [0, 1, 1], opacity: [1, 1, 0] },
    transition: { duration: LIFE, times: [0, 0.25, 1], ease: "easeOut" },
  } satisfies HTMLMotionProps<"div">
  const idleInner: HTMLMotionProps<"div"> = {}

  switch (variant) {
    case 2: {
      return {
        container: fade,
        inner: {
          animate: { filter: ["brightness(2.6)", "brightness(1)"] },
          transition: { duration: 0.45, ease: "easeOut" },
        },
      }
    }
    case 3: {
      return {
        container: {
          initial: { scale: 0, opacity: 1, y: 0 },
          animate: { scale: [0, 1, 1], opacity: [1, 1, 0], y: [0, 0, -48] },
          transition: { duration: LIFE, times: [0, 0.25, 1], ease: "easeOut" },
        },
        inner: idleInner,
      }
    }
    case 4: {
      const dx = clamp(item.vx * 12, -160, 160)
      const dy = clamp(item.vy * 12, -160, 160)
      return {
        container: {
          initial: { scale: 0, opacity: 1, x: 0, y: 0 },
          animate: {
            scale: [0, 1, 1],
            opacity: [1, 1, 0],
            x: [0, dx * 0.6, dx],
            y: [0, dy * 0.6, dy],
          },
          transition: { duration: LIFE, times: [0, 0.25, 1], ease: "easeOut" },
        },
        inner: idleInner,
      }
    }
    case 5: {
      return {
        container: {
          initial: { scale: 0, opacity: 1, rotate: item.angle },
          animate: { scale: [0, 1, 1], opacity: [1, 1, 0], rotate: item.angle },
          transition: { duration: LIFE, times: [0, 0.25, 1], ease: "easeOut" },
        },
        inner: idleInner,
      }
    }
    case 6: {
      const blur = clamp(item.speed * 0.6, 0, 12)
      const gray = clamp(item.speed / 18, 0, 1)
      return {
        container: fade,
        inner: {
          initial: { filter: `blur(${blur}px) grayscale(${gray})` },
          animate: { filter: "blur(0px) grayscale(0)" },
          transition: { duration: LIFE * 0.7, ease: "easeOut" },
        },
      }
    }
    case 7: {
      return {
        container: {
          initial: { scale: 0, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0, opacity: 0 },
          transition: { duration: 0.3, ease: "easeOut" },
        },
        inner: idleInner,
      }
    }
    case 8: {
      const rotateY = clamp(item.vx * 2.5, -28, 28)
      const rotateX = clamp(-item.vy * 2.5, -28, 28)
      return {
        container: {
          initial: { scale: 0, opacity: 1, rotateX, rotateY },
          animate: { scale: [0, 1, 1], opacity: [1, 1, 0], rotateX, rotateY },
          transition: { duration: LIFE, times: [0, 0.25, 1], ease: "easeOut" },
          style: { transformPerspective: 800 },
        },
        inner: idleInner,
      }
    }
    case 1:
    default: {
      return { container: fade, inner: idleInner }
    }
  }
}

interface ImageTrailItemProps {
  item: TrailItem
  variant: ImageTrailVariant
  onDone: () => void
}

function ImageTrailItem({ item, variant, onDone }: ImageTrailItemProps) {
  const { container, inner } = getVariantMotion(variant, item)

  return (
    <div
      data-trail-item
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        left: item.x,
        top: item.y,
        width: TRAIL_WIDTH,
        height: TRAIL_HEIGHT,
      }}
    >
      <motion.div
        {...container}
        onAnimationComplete={variant === 7 ? undefined : onDone}
        className="relative h-full w-full overflow-hidden rounded-sm shadow-lg ring-1 ring-hairline"
      >
        <motion.div {...inner} className="relative h-full w-full">
          <Image
            fill
            sizes="128px"
            src={item.src}
            alt=""
            className="object-cover"
            onError={(e) => {
              // Hide the whole styled box, not just the <img>, so a broken
              // image doesn't trail an empty ringed/shadowed rectangle.
              const box = e.currentTarget.closest("[data-trail-item]")
              if (box instanceof HTMLElement) box.style.display = "none"
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
