"use client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import type { Experience, Role } from "@/lib/content/experience"
import { ExperienceRoleDescription } from "@/components/experience-role-description"
import {
  formatExperienceDuration,
  formatCompanyDuration,
  formatDateRange,
} from "@/lib/utils/experienceDuration"

const TYPE_LABELS: Record<Experience["type"], string> = {
  fulltime: "Full-time",
  parttime: "Part-time",
  contract: "Contract",
}

const LOCATION_TYPE_LABELS: Record<Experience["locationType"], string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
}

function InitialsPlaceholder({ company }: { company: string }) {
  const initials = company
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex size-12 items-center justify-center rounded-sm bg-surface-2">
      <span className="font-mono text-sm text-muted-foreground">
        {initials}
      </span>
    </div>
  )
}

function CompanyLogo({
  company,
  companyLogo,
}: {
  company: string
  companyLogo?: string
}) {
  const [error, setError] = useState(false)

  if (companyLogo && !error) {
    return (
      <Image
        src={companyLogo}
        alt={`${company} logo`}
        width={48}
        height={48}
        className="rounded-sm object-contain"
        onError={() => setError(true)}
      />
    )
  }

  return <InitialsPlaceholder company={company} />
}

function RoleItem({ role }: { role: Role }) {
  const duration = formatExperienceDuration(role.startDate, role.endDate)
  const dateRange = formatDateRange(role.startDate, role.endDate)

  return (
    <li className="flex gap-3">
      {/* Timeline rail */}
      <div className="flex flex-col items-center" aria-hidden="true">
        <div className="size-2 rounded-full bg-muted-foreground"></div>
        <div className="mt-1 w-px flex-1 bg-hairline" />
      </div>

      {/* Role content */}
      <div className="pb-6">
        <h3 className="text-sm font-semibold break-words text-foreground">
          {role.name}
        </h3>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          {dateRange} · {duration}
        </p>
        {role.description && (
          <ExperienceRoleDescription description={role.description} />
        )}
      </div>
    </li>
  )
}

interface ExperienceCompanyProps {
  entry: Experience
}

export function ExperienceCompany({ entry }: ExperienceCompanyProps) {
  const companyDuration = formatCompanyDuration(entry.roles)
  const typeLabel = TYPE_LABELS[entry.type]
  const locationText = [
    entry.location,
    LOCATION_TYPE_LABELS[entry.locationType],
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <article className="rounded-lg border border-hairline bg-surface p-5 transition-colors hover:bg-surface-2/50">
      <div className="flex gap-4">
        <div className="shrink-0">
          <CompanyLogo
            company={entry.company}
            companyLogo={entry.companyLogo}
          />
        </div>

        <div className="min-w-0 flex-1">
          {/* Company header */}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h2 className="text-base font-semibold break-words text-foreground">
              {entry.company}
            </h2>
            {entry.org && (
              <Link
                href={`/work?org=${encodeURIComponent(entry.org)}`}
                className="font-mono text-xs text-lime hover:underline focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              >
                View projects
              </Link>
            )}
          </div>

          <p className="font-mono text-xs text-muted-foreground">
            {typeLabel} · {companyDuration}
          </p>

          {locationText && (
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {locationText}
            </p>
          )}

          {/* Roles timeline */}
          <ol className="mt-3">
            {entry.roles.map((role, idx) => (
              <RoleItem key={idx} role={role} />
            ))}
          </ol>
        </div>
      </div>
    </article>
  )
}
