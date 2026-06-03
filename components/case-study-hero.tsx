"use client"

import { motion } from "framer-motion"
import Image from "next/image"

import { useShouldAnimate } from "@/hooks/use-should-animate"
import { cn } from "@/lib/utils"

import type { Project } from "@/lib/content/projects"
import { ProjectMediaGallery } from "./project-media-gallery"

interface CaseStudyHeroProps {
  project: Project
  images?: string[]
  videos?: string[]
}

export function CaseStudyHero({ project, images, videos }: CaseStudyHeroProps) {
  const shouldAnimate = useShouldAnimate()
  const meta = [project.org, project.type].filter(Boolean).join(" · ")
  const marqueeItems = Array.from({ length: 8 }, () => project.name)

  return (
    <section className="relative mb-10">
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 24 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldAnimate ? 0.4 : 0.001, ease: "easeOut" }}
        className="grid items-end gap-6 md:grid-cols-[1.2fr_1fr]"
      >
        <div>
          <h1 className="font-title text-5xl leading-[0.95] text-balance md:text-7xl">
            {project.name}
          </h1>
          {meta && (
            <p className="mt-4 font-mono text-xs tracking-wider text-muted-foreground uppercase">
              {meta}
            </p>
          )}
          <p className="mt-5 max-w-prose text-sm leading-relaxed text-foreground">
            {project.description}
          </p>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-hairline bg-surface bg-grid">
          {!!images?.length ? (
            <ProjectMediaGallery
              images={images || []}
              videos={videos || []}
              projectName={project.name}
              className="h-full aspect-[4/3]  "
              autoLoop
            />
            // <Image
            //   fill
            //   sizes="(min-width: 768px) 40vw, 100vw"
            //   src={image}
            //   alt={`${project.name} featured screenshot`}
            //   className="object-cover"
            //   priority
            //   onError={(e) => {
            //     const img = e.currentTarget as HTMLImageElement
            //     img.style.display = "none"
            //   }}
            // />
          ) : (
            <div className="flex h-full flex-col items-start justify-end p-5">
              <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                {project.type}
              </span>
              <span className="font-title text-3xl text-muted-foreground/60">
                no preview
              </span>
            </div>
          )}
        </div>
      </motion.div>

      <div
        aria-hidden="true"
        className="mt-8 overflow-hidden border-y border-hairline py-3"
      >
        <div className={cn("flex w-max", shouldAnimate && "animate-marquee")}>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="font-title text-2xl whitespace-nowrap text-muted-foreground/40"
            >
              <span className="px-4 text-lime">·</span>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
