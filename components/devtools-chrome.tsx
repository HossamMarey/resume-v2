"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { profile } from "@/lib/content/profile"
import { XP_EVENT } from "@/lib/xp/bus"
import type { XPEventDetail } from "@/lib/xp/bus"
import { XPBar } from "@/components/xp-bar"
import { XPToast } from "@/components/xp-toast"
import { useRouter } from "next/navigation"
import { useXP } from "@/hooks/use-xp"
import { useRecruiterMode } from "@/hooks/use-recruiter-mode"
import {
  Code,
  Globe,
  Terminal,
  Activity,
  FileText,
  Briefcase,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Tab {
  href: string
  label: string
  icon: LucideIcon
}

const tabs: Tab[] = [
  { href: "/", label: "Elements", icon: Code },
  { href: "/experience", label: "Experience", icon: Briefcase },
  { href: "/work", label: "Network", icon: Globe },
  { href: "/console", label: "Console", icon: Terminal },
  // { href: "/perf", label: "Performance", icon: Activity },
  { href: "/sources", label: "Sources", icon: FileText },
]

function isActiveTab(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  if (pathname === href) return true
  if (href === "/") return false
  return pathname.startsWith(href + "/")
}

interface ActiveToast {
  id: number
  delta: number
  reason: string
}

const TOAST_DURATION_MS = 1200

export function DevToolsChrome() {
  const pathname = usePathname()
  const router = useRouter()
  const { xp } = useXP()
  const { setRecruiterMode } = useRecruiterMode()
  const [toast, setToast] = useState<ActiveToast | null>(null)
  const displayName = profile.name?.trim() || "Hossam Marey"
  const displayRole = profile.role?.trim() || "Senior Front-End Developer"

  const handleRecruiterMode = () => {
    setRecruiterMode(true)
    router.push("/recruiter")
  }

  useEffect(() => {
    function onXp(event: Event) {
      const { delta, reason, timestamp } = (event as CustomEvent<XPEventDetail>)
        .detail
      setToast({ id: timestamp, delta, reason })
    }

    window.addEventListener(XP_EVENT, onXp)
    return () => window.removeEventListener(XP_EVENT, onXp)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <header className="border-b border-hairline bg-surface">
      <div className="flex items-center justify-between px-4 py-2">
        <div
          className="flex items-baseline gap-2"
          aria-label={`${displayName}, ${displayRole}`}
        >
          <span className="text-sm font-semibold text-foreground">
            {displayName}
          </span>
          <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
            {displayRole}
          </span>
        </div>
        <div className="relative ms-auto flex items-center gap-3">
          <button
            onClick={handleRecruiterMode}
            className="hidden border border-lime px-2 py-1 font-mono text-xs tracking-wider text-foreground uppercase transition-colors hover:bg-lime/10 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:inline-flex"
            aria-label="Toggle Recruiter Mode"
          >
            Recruiter Mode
          </button>
          <XPBar xp={xp} />
          <AnimatePresence>
            {toast && (
              <XPToast
                key={toast.id}
                delta={toast.delta}
                reason={toast.reason}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop tab row — hidden on mobile */}
      <nav aria-label="DevTools tabs" className="hidden sm:flex">
        <ul className="flex gap-1 px-4">
          {tabs.map((tab) => {
            const isActive = isActiveTab(pathname, tab.href)
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={cn(
                    "inline-block border-b-2 px-3 py-2 font-mono text-xs tracking-wider uppercase transition-colors",
                    isActive
                      ? "border-lime text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="DevTools tabs"
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="flex w-full">
        {tabs.map((tab) => {
          const isActive = isActiveTab(pathname, tab.href)
          const Icon = tab.icon
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 border-t-2 px-1 py-1 transition-colors focus-visible:ring-1 focus-visible:ring-lime focus-visible:outline-none",
                  isActive
                    ? "border-lime text-foreground"
                    : "border-transparent text-muted-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden max-w-full truncate font-mono text-[0.625rem] leading-none tracking-wider uppercase [@media(min-width:380px)]:block">
                  {tab.label}
                </span>
                {isActive && (
                  <span
                    className="h-1 w-1 rounded-full bg-lime [@media(min-width:380px)]:hidden"
                    aria-hidden="true"
                  />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
