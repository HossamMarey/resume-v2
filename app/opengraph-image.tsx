import { ImageResponse } from "next/og"

import { profile } from "@/lib/content/profile"
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt =
  "devtools://hossam — Hossam Marey, Senior Front-End Developer"

export default function OpenGraphImage() {
  return new ImageResponse(
    renderOgImage({
      title: "devtools://hossam",
      subtitle: profile.role,
    }),
    { ...OG_SIZE }
  )
}
