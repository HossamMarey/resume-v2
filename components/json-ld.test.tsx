import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { JsonLd } from "./json-ld"

describe("JsonLd", () => {
  it("renders a script tag with type application/ld+json", () => {
    const { container } = render(
      <JsonLd data={{ "@type": "Person", name: "X" }} />
    )
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeTruthy()
  })

  it("round-trips JSON data", () => {
    const data = { "@type": "Person", name: "Alice" }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const parsed = JSON.parse(script?.textContent ?? "{}")
    expect(parsed).toEqual(data)
  })

  it("escapes \u003c to prevent script injection", () => {
    const data = { evil: "</script><script>alert(1)</script>" }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const html = script?.innerHTML ?? ""
    expect(html).not.toContain("</script")
    expect(html).toContain("\\u003c/script")
  })
})
