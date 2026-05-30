"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { profile } from "@/lib/content/profile"

const tabs = [
  { href: "/", label: "Elements" },
  { href: "/work", label: "Network" },
  { href: "/console", label: "Console" },
  { href: "/perf", label: "Performance" },
  { href: "/sources", label: "Sources" },
]

function isActiveTab(pathname: string, href: string): boolean {
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
      <nav aria-label="DevTools tabs">
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
