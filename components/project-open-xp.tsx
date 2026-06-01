"use client"

import { useEffect } from "react"

import { emitXP } from "@/lib/xp/bus"

export function ProjectOpenXp({ slug }: { slug: string }) {
  useEffect(() => {
    emitXP(15, `open:${slug}`)
  }, [slug])

  return null
}
