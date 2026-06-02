export const OG_SIZE = { width: 1200, height: 630 }

export const OG_CONTENT_TYPE = "image/png"

export function renderOgImage({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#0B0D10",
        padding: 64,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          maxWidth: 900,
        }}
      >
        <div
          style={{
            color: "#C6F24E",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          devtools://hossam
        </div>
        <div
          style={{
            color: "#ffffff",
            fontSize: 72,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.1,
            wordBreak: "break-word",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              color: "#9ca3af",
              fontSize: 32,
              fontWeight: 400,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )
}
