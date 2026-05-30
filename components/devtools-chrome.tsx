"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

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

  return (
    <header className="border-b border-hairline bg-surface">
      <div className="px-4 py-2 text-xs font-mono text-muted-foreground">
        {/* Identity strip placeholder — Story 2.2 */}
        devtools://hossam
      </div>
      <nav aria-label="DevTools panels">
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
