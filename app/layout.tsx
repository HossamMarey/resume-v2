import type { ReactNode } from "react"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import { KonamiListener } from "@/components/konami-listener"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { fontVariables } from "@/lib/font"
import {
  OG_LOCALE,
  SITE_DESCRIPTION_DEFAULT,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
  SITE_URL,
} from "@/lib/site"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s — devtools://hossam",
    default: SITE_TITLE_DEFAULT,
  },
  description: SITE_DESCRIPTION_DEFAULT,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: OG_LOCALE,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={cn("h-full antialiased", fontVariables)}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
        <KonamiListener />
      </body>
    </html>
  )
}
