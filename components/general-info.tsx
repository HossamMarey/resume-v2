import {
  ComputedStylesCell,
  ComputedStylesPanel,
} from "@/components/computed-styles-panel"
import { profile } from "@/lib/content/profile"

export function GeneralInfo() {
  const headingId = "general-info-heading"

  return (
    <section
      aria-labelledby={headingId}
      className="px-4 py-16 sm:px-8 lg:px-12"
    >
      <h2
        id={headingId}
        className="mb-6 font-mono text-sm tracking-wider text-muted-foreground uppercase"
      >
        General Info
      </h2>

      <ComputedStylesPanel className="sm:grid-cols-2">
        {profile.personalInfo.map((item) => (
          <ComputedStylesCell key={item.label}>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-4">
              <span className="font-mono text-sm text-lime">{item.label}</span>
              <span className="text-sm text-muted-foreground">
                {item.value}
              </span>
            </div>
          </ComputedStylesCell>
        ))}
      </ComputedStylesPanel>
    </section>
  )
}
