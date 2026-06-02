interface JsonLdProps {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // Owned static JSON-LD only — no user input. Sanctioned exception to
      // the no-dangerouslySetInnerHTML rule (NFR-SE3 / epics.md:767).
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}
