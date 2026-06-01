"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { CommandPalette } from "@/components/command-palette"
import { DevToolsChrome, MobileBottomNav } from "@/components/devtools-chrome"
import { emitXP } from "@/lib/xp/bus"
import { useShouldAnimate } from "@/hooks/use-should-animate"
import { useEffect, useState } from "react"

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: "easeOut" as const },
  },
}

const tabReasons: Record<string, string> = {
  "/": "visit:elements",
  "/work": "visit:network",
  "/console": "visit:console",
  "/perf": "visit:performance",
  "/sources": "visit:sources",
}

export default function ChromeLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const animate = useShouldAnimate()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const reason = pathname ? tabReasons[pathname] : undefined
    if (reason) emitXP(10, reason)
  }, [pathname])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <DevToolsChrome />
      <main
        id="main-content"
        className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: mounted ? (animate ? 0.2 : 0.001) : 0.001,
              ease: "easeOut",
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <CommandPalette />
      <MobileBottomNav />
    </>
  )
}
