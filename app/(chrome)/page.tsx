import type { Metadata } from "next"

import { GeneralInfo } from "@/components/general-info"
import { InspectMeCta } from "@/components/inspect-me-cta"
import { JsonLd } from "@/components/json-ld"
import { SocialLinks } from "@/components/social-links"
import { StackMarquee } from "@/components/stack-marquee"
import { primarySkills } from "@/lib/content/skills"
import { profile } from "@/lib/content/profile"
import { siteUrl } from "@/lib/site"

export const metadata: Metadata = {
  title: "Elements",
  description:
    "Elements panel — the front page of devtools://hossam. Identity, stack, and general info.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "Elements — devtools://hossam",
    description:
      "Elements panel — the front page of devtools://hossam. Identity, stack, and general info.",
  },
}

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.role,
  url: siteUrl("/"),
  sameAs: profile.socials.map((s) => s.href),
  address: {
    "@type": "PostalAddress",
    addressCountry: profile.location,
  },
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: profile.name,
  url: siteUrl("/"),
}

export default function ElementsPage() {
  return (
    <>
      <JsonLd data={personJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <section className="relative flex min-h-[500px] flex-col items-start justify-center px-4 py-10 sm:px-8 lg:px-12 lg:py-[10vh]">
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
        <div className="relative z-10 flex w-full max-w-4xl flex-col gap-6">
          <h1 className="font-title text-[clamp(2rem,10vw,6rem)] leading-[0.95] font-semibold tracking-tight">
            {profile.name}
          </h1>

          <p className="font-mono text-sm tracking-wider text-muted-foreground uppercase">
            {profile.role}
          </p>

          <p className="max-w-4xl text-lg leading-relaxed text-muted-foreground">
            {profile.tagline}
          </p>

          <InspectMeCta />

          <SocialLinks />
        </div>
      </section>

      <StackMarquee skills={primarySkills} />

      <GeneralInfo />
    </>
  )
}
