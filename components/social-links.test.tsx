import { render, screen } from "@testing-library/react"

import { profile } from "@/lib/content/profile"

import { SocialLinks } from "./social-links"

describe("SocialLinks", () => {
  it("renders one accessible link per social", () => {
    render(<SocialLinks />)

    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(profile.socials.length)

    for (const social of profile.socials) {
      expect(
        screen.getByRole("link", { name: social.label })
      ).toBeInTheDocument()
    }
  })

  it("leaves mailto links in-page and opens external links safely", () => {
    render(<SocialLinks />)

    const mailtoSocial = profile.socials.find((s) =>
      s.href.startsWith("mailto:")
    )
    const externalSocial = profile.socials.find(
      (s) => !s.href.startsWith("mailto:")
    )
    expect(mailtoSocial).toBeDefined()
    expect(externalSocial).toBeDefined()

    const mailtoLink = screen.getByRole("link", { name: mailtoSocial!.label })
    expect(mailtoLink).not.toHaveAttribute("target")

    const externalLink = screen.getByRole("link", {
      name: externalSocial!.label,
    })
    expect(externalLink).toHaveAttribute("target", "_blank")
    expect(externalLink).toHaveAttribute("rel", "noopener noreferrer")
  })
})
