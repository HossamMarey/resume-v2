import { NetworkImageTrail } from "@/components/network-image-trail"
import {
  NetworkWaterfallCard,
  NetworkWaterfallRow,
} from "@/components/network-waterfall-row"

import type { ImageTrailVariant } from "@/components/network-image-trail"
import type { Project } from "@/lib/content/projects"

const HEADERS = ["NAME", "TYPE", "STACK", "LINKS"] as const

interface NetworkWaterfallTableProps {
  projects: readonly Project[]
  variant?: ImageTrailVariant
}

export function NetworkWaterfallTable({
  projects,
  variant = 1,
}: NetworkWaterfallTableProps) {
  return (
    <NetworkImageTrail variant={variant}>
      <table className="hidden w-full sm:table">
        <thead>
          <tr className="border-b border-hairline">
            {HEADERS.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-2 py-2 text-start font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <NetworkWaterfallRow key={p.slug} project={p} />
          ))}
        </tbody>
      </table>
      <div className="block sm:hidden">
        {projects.map((p) => (
          <NetworkWaterfallCard key={p.slug} project={p} />
        ))}
      </div>
    </NetworkImageTrail>
  )
}
