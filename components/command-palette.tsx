"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useShouldAnimate } from "@/hooks/use-should-animate"
import { isTypingTarget } from "@/lib/keyboard"
import { registerPaletteOpener } from "@/lib/command-palette/bus"
import { EXPERIMENTAL_ENABLED, profile, projects } from "@/lib/content"
import { useUnlocks } from "@/hooks/use-unlocks"
import { useRecruiterMode } from "@/hooks/use-recruiter-mode"
import { cn } from "@/lib/utils"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const animate = useShouldAnimate()
  const { isUnlocked } = useUnlocks()
  const { setRecruiterMode } = useRecruiterMode()

  useEffect(() => {
    return registerPaletteOpener(() => setOpen(true))
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() !== "k" ||
        !(event.metaKey || event.ctrlKey)
      ) {
        return
      }
      event.preventDefault()
      setOpen((prev) => {
        if (prev) return false
        if (isTypingTarget(event.target)) return false
        return true
      })
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const handleNavigate = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const handleToggleTheme = () => {
    setOpen(false)
    toast("Site is dark-only. The vibe is intentional.", {
      id: "theme-dark-only",
    })
  }

  const handleDownloadResume = () => {
    setOpen(false)
    const a = document.createElement("a")
    a.href = "/hossam-marey-resume.pdf"
    a.download = ""
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleToggleRecruiterMode = () => {
    setOpen(false)
    setRecruiterMode(true)
    router.push("/recruiter")
  }

  const handleOpenExperimental = () => {
    setOpen(false)
    router.push("/console")
  }

  const handleCopyEmail = () => {
    setOpen(false)
    navigator.clipboard?.writeText(profile.email)
    toast("Email copied to clipboard.")
  }

  const handleOpenSocial = (href: string) => {
    setOpen(false)
    window.open(href, "_blank", "noopener,noreferrer")
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      className={cn(!animate && "!animate-none")}
    >
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>
          No matches — try a route, project, or action.
        </CommandEmpty>

        <CommandGroup heading="Navigate">
          <CommandItem
            value="Elements"
            keywords={["home", "about", "identity"]}
            onSelect={() => handleNavigate("/")}
          >
            Elements
          </CommandItem>
          <CommandItem
            value="Network"
            keywords={["work", "projects"]}
            onSelect={() => handleNavigate("/work")}
          >
            Network
          </CommandItem>
          <CommandItem
            value="Console"
            keywords={["repl", "terminal", "shell"]}
            onSelect={() => handleNavigate("/console")}
          >
            Console
          </CommandItem>
          <CommandItem
            value="Performance"
            keywords={["perf", "metrics", "speed"]}
            onSelect={() => handleNavigate("/perf")}
          >
            Performance
          </CommandItem>
          <CommandItem
            value="Sources"
            keywords={["files", "code", "tree"]}
            onSelect={() => handleNavigate("/sources")}
          >
            Sources
          </CommandItem>
          <CommandItem
            value="Experience"
            keywords={["work", "history", "career", "jobs"]}
            onSelect={() => handleNavigate("/experience")}
          >
            Experience
          </CommandItem>

          <CommandItem
            value="Contact"
            keywords={["contact", "message", "email", "phone", "address"]}
            onSelect={() => handleNavigate("/sources?tab=contact")}
          >
            Contact
          </CommandItem>

          <CommandItem
            value="Recruiter"
            keywords={["resume", "cv", "hire"]}
            onSelect={() => handleNavigate("/recruiter")}
          >
            Recruiter
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Actions">
          <CommandItem
            value="Toggle Recruiter Mode"
            keywords={["recruiter", "mode", "resume"]}
            onSelect={handleToggleRecruiterMode}
          >
            Toggle Recruiter Mode
          </CommandItem>
          <CommandItem
            value="Download Resume"
            keywords={["pdf", "cv", "download"]}
            onSelect={handleDownloadResume}
          >
            Download Resume
          </CommandItem>
          {profile.email !== "" && (
            <CommandItem
              value="Copy Email"
              keywords={["email", "copy", "contact"]}
              onSelect={handleCopyEmail}
            >
              Copy Email
            </CommandItem>
          )}
          <CommandItem
            value="Toggle Theme"
            keywords={["theme", "dark", "light", "mode"]}
            onSelect={handleToggleTheme}
          >
            Toggle Theme
          </CommandItem>
          {isUnlocked("konami") && EXPERIMENTAL_ENABLED && (
            <CommandItem
              value="Experimental"
              keywords={["experimental", "unlock", "konami", "secret"]}
              onSelect={handleOpenExperimental}
            >
              Experimental
            </CommandItem>
          )}
        </CommandGroup>

        <CommandGroup heading="Socials">
          {profile.socials.map((s) => (
            <CommandItem
              key={s.href}
              value={s.label}
              onSelect={() => handleOpenSocial(s.href)}
            >
              {s.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Projects">
          {projects.map((p) => (
            <CommandItem
              key={p.slug}
              value={p.name}
              keywords={[p.slug, ...p.stack]}
              onSelect={() => handleNavigate("/work/" + p.slug)}
            >
              {p.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      <div className="flex items-center justify-center gap-2 border-t border-hairline px-3 py-2 text-muted-foreground">
        <kbd className="rounded border border-hairline px-1.5 py-0.5 font-mono text-[10px]">
          ↑↓
        </kbd>
        <span className="text-[10px]">navigate</span>
        <span className="text-[10px] text-muted-foreground">·</span>
        <kbd className="rounded border border-hairline px-1.5 py-0.5 font-mono text-[10px]">
          ↵
        </kbd>
        <span className="text-[10px]">select</span>
        <span className="text-[10px] text-muted-foreground">·</span>
        <kbd className="rounded border border-hairline px-1.5 py-0.5 font-mono text-[10px]">
          esc
        </kbd>
        <span className="text-[10px]">close</span>
      </div>
    </CommandDialog>
  )
}
