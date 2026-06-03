import { Mail } from "lucide-react"

import { BrandIcon } from "@/components/brand-icons"
import { profile } from "@/lib/content/profile"
import { cn } from "@/lib/utils"

export function SocialLinks() {
  return (
    <ul className="flex flex-wrap items-center gap-2" role="list">
      {profile.socials.map((social) => {
        const isMailto = social.href.startsWith("mailto:")
        return (
          <li key={social.href}>
            <a
              href={social.href}
              aria-label={social.label}
              {...(isMailto
                ? {}
                : { target: "_blank", rel: "noopener noreferrer" })}
              className={cn(
                "flex size-9 items-center justify-center rounded border border-hairline text-muted-foreground",
                "transition-colors hover:border-lime/50 hover:text-lime",
                "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              )}
            >
              {social.icon === "email" ? (
                <Mail className="size-4" aria-hidden="true" />
              ) : (
                <BrandIcon name={social.icon} className="size-4" />
              )}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
