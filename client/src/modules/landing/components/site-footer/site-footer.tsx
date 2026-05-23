import { GraduationCap, Mail } from "lucide-react"

import { Separator } from "@/shared/components/ui/separator"

const footerLinks = {
  Product: ["Features", "Pricing", "Security", "Release Notes"],
  "Legal & Support": ["Contact Us", "Help Center", "Privacy Policy", "Terms of Service"],
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background px-5 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 pb-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <a className="flex items-center gap-2 font-semibold tracking-normal" href="#">
              <GraduationCap className="size-5 text-muted-foreground" aria-hidden="true" />
              EduManager
            </a>
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
                  <li key={link}>
                    <a className="transition hover:text-foreground" href="#">
                      {link}
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
            <span>support@edumanager.example</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { SiteFooter }
