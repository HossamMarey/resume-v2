import type { Metadata } from "next"

import { InspectMeCta } from "@/components/inspect-me-cta"
import { PrinciplesPanel } from "@/components/principles-panel"
import { StackMarquee } from "@/components/stack-marquee"
import { primarySkills } from "@/lib/content/skills"
import { profile } from "@/lib/content/profile"

export const metadata: Metadata = {
  title: "Elements — devtools://hossam",
}

export default function ElementsPage() {
  return (
    <>
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-start justify-center px-4 py-16 sm:px-8 lg:px-12">
        {/* Decorative texture layer — aria-hidden as decorative */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-grid opacity-40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-scan opacity-60"
        />

        {/* Content sits above texture via stacking context */}
        <div className="relative z-10 flex max-w-3xl flex-col gap-6">
          <h1 className="font-title text-[clamp(2rem,10vw,6rem)] leading-[0.95] font-semibold tracking-tight">
            {profile.name}
          </h1>

          <p className="font-mono text-sm tracking-wider text-muted-foreground uppercase">
            {profile.role}
          </p>

          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            {profile.tagline}
          </p>

          <InspectMeCta />
        </div>
      </section>

      <PrinciplesPanel principles={profile.principles} />

      <StackMarquee skills={primarySkills} />
    </>
  )
}
