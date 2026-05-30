"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { profile } from "@/lib/content/profile"
import {
  Code,
  Globe,
  Terminal,
  Activity,
  FileText,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Tab {
  href: string
  label: string
  icon: LucideIcon
}

const tabs: Tab[] = [
  { href: "/", label: "Elements", icon: Code },
  { href: "/work", label: "Network", icon: Globe },
  { href: "/console", label: "Console", icon: Terminal },
  { href: "/perf", label: "Performance", icon: Activity },
  { href: "/sources", label: "Sources", icon: FileText },
]

function isActiveTab(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  if (pathname === href) return true
  if (href === "/") return false
  return pathname.startsWith(href + "/")
}

export function DevToolsChrome() {
  const pathname = usePathname()
  const displayName = profile.name?.trim() || "Hossam Marey"
  const displayRole = profile.role?.trim() || "Senior Front-End Developer"

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
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {displayRole}
          </span>
        </div>
        <div className="ms-auto flex items-center gap-3">
          {/* Recruiter Mode chip — Epic 6 */}
          {/* XP bar — Story 2.5 */}
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
                    "inline-block border-b-2 px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
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
      className="fixed bottom-0 inset-x-0 z-50 flex sm:hidden border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)]"
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
                  "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-1 border-t-2 px-1 py-1 transition-colors focus-visible:ring-1 focus-visible:ring-lime focus-visible:outline-none",
                  isActive
                    ? "border-lime text-foreground"
                    : "border-transparent text-muted-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden [@media(min-width:380px)]:block font-mono text-[0.625rem] uppercase tracking-wider truncate max-w-full leading-none">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="[@media(min-width:380px)]:hidden h-1 w-1 rounded-full bg-lime" aria-hidden="true" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
