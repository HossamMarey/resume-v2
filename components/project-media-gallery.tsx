"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

import { useShouldAnimate } from "@/hooks/use-should-animate"
import { cn } from "@/lib/utils"

interface ProjectMediaGalleryProps {
  images: string[]
  videos: string[]
  projectName: string
  className?: string
  autoLoop?: boolean
  duration?: number
  pauseOnHover?: boolean
}

export function ProjectMediaGallery({
  images,
  videos,
  projectName,
  className = "",
  autoLoop = false,
  duration = 5000,
  pauseOnHover = true,
}: ProjectMediaGalleryProps) {
  const shouldAnimate = useShouldAnimate()
  const slides = [...images, ...videos]
  const total = slides.length

  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(((index % total) + total) % total)
    },
    [total]
  )

  const goNext = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex])
  const goPrev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault()
        goNext()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        goPrev()
      }
    },
    [goNext, goPrev]
  )

  // Auto-slide when autoLoop is enabled, pause on hover
  useEffect(() => {
    if (!autoLoop || total <= 1 || (pauseOnHover && isPaused)) return
    const id = setInterval(goNext, duration)
    return () => clearInterval(id)
  }, [autoLoop, total, goNext, duration, pauseOnHover, isPaused])

  if (total === 0) return null

  const currentSlide = slides[activeIndex]
  const isVideo = activeIndex >= images.length

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={`${projectName} media`}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      tabIndex={0}
      className="focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div
        className={cn(
          "relative aspect-video max-h-[80vh] w-full overflow-hidden rounded-sm bg-surface-2/30",
          className
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={
              shouldAnimate ? { opacity: 0, x: 40 } : { opacity: 1, x: 0 }
            }
            animate={{ opacity: 1, x: 0 }}
            exit={shouldAnimate ? { opacity: 0, x: -40 } : { opacity: 0 }}
            transition={{ duration: shouldAnimate ? 0.25 : 0.001 }}
            className="absolute inset-0"
            aria-label={`Slide ${activeIndex + 1} of ${total}`}
            role="group"
            aria-roledescription="slide"
          >
            {isVideo ? (
              <video
                controls
                preload="metadata"
                playsInline
                className="h-full w-full object-cover"
                src={currentSlide}
                onError={(e) => {
                  const video = e.currentTarget
                  video.style.display = "none"
                  video.parentElement?.classList.add("bg-surface-2")
                  if (video.parentElement) {
                    video.parentElement.innerHTML =
                      "<p class='flex h-full items-center justify-center text-sm text-muted-foreground'>Video failed to load</p>"
                  }
                }}
              ></video>
            ) : (
              <Image
                fill
                sizes="(min-width: 1024px) 800px, 100vw"
                src={currentSlide}
                alt={`${projectName} screenshot ${activeIndex + 1}`}
                className="object-cover"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement
                  img.style.display = "none"
                  img.parentElement?.classList.add("bg-surface-2")
                  if (img.parentElement) {
                    img.parentElement.innerHTML =
                      "<p class='flex h-full items-center justify-center text-sm text-muted-foreground'>Image failed to load</p>"
                  }
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous slide"
              className="absolute start-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground transition-colors hover:bg-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next slide"
              className="absolute end-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground transition-colors hover:bg-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      <span className="sr-only" aria-live="polite">
        {isVideo
          ? `Video slide ${activeIndex + 1} of ${total}`
          : `Image slide ${activeIndex + 1} of ${total}: ${projectName} screenshot ${activeIndex + 1}`}
      </span>

      {total > 1 && (
        <div className="mt-2 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === activeIndex ? "true" : undefined}
                className={cn(
                  "size-2 rounded-full transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
                  i === activeIndex ? "bg-lime" : "bg-muted-foreground/40"
                )}
              />
            ))}
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {activeIndex + 1} / {total}
          </span>
        </div>
      )}
    </div>
  )
}
