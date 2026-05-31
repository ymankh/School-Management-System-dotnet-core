import { GraduationCap, Mail } from "lucide-react"
import { Link } from "@tanstack/react-router"

import { Separator } from "@/shared/components/ui/separator"

const supportEmail = "support@edumanager.example"

const footerLinks = {
  Product: [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: `mailto:${supportEmail}?subject=EduManager%20security%20information`, label: "Security" },
    { href: `mailto:${supportEmail}?subject=EduManager%20release%20notes`, label: "Release Notes" },
  ],
  "Legal & Support": [
    { href: "#contact", label: "Contact Us" },
    { href: `mailto:${supportEmail}?subject=EduManager%20help`, label: "Help Center" },
    { href: `mailto:${supportEmail}?subject=EduManager%20privacy%20policy`, label: "Privacy Policy" },
    { href: `mailto:${supportEmail}?subject=EduManager%20terms%20of%20service`, label: "Terms of Service" },
  ],
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background px-5 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 pb-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Link className="flex items-center gap-2 font-semibold tracking-normal" to="/">
              <GraduationCap className="size-5 text-muted-foreground" aria-hidden="true" />
              EduManager
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">
              The modern academic management system designed for precision,
              clarity, and efficiency in educational environments.
            </p>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold text-foreground">{group}</h3>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                {links.map((link) => (
                  <li key={link.label}>
                    <a className="transition hover:text-foreground" href={link.href}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-4 pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2024 EduManager Systems, Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <Mail className="size-4" aria-hidden="true" />
            <a className="transition hover:text-foreground" href={`mailto:${supportEmail}`}>{supportEmail}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { SiteFooter }
