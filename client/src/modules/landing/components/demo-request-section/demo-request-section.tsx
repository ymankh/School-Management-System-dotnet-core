import { CheckCircle2 } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

function DemoRequestSection() {
  return (
    <section className="bg-muted px-5 py-24 sm:px-6 lg:px-8" id="contact">
      <Card className="mx-auto grid max-w-7xl overflow-hidden rounded-lg border border-border bg-card p-0 shadow-sm ring-0 lg:grid-cols-[0.72fr_1fr]">
        <div className="bg-primary p-10 text-primary-foreground sm:p-12">
          <h2 className="text-3xl font-semibold tracking-normal">Request a Platform Demo</h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-primary-foreground/80">
            See firsthand how EduManager can transform your administrative workflows.
            Fill out the form, and our onboarding specialists will contact you.
          </p>

          <ul className="mt-9 space-y-5 text-sm font-medium">
            {[
              "Personalized walkthrough of admin tools",
              "Data migration consultation",
              "Custom pricing estimate",
            ].map((item) => (
              <li className="flex items-center gap-3" key={item}>
                <CheckCircle2 className="size-5 text-primary-foreground/80" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <form
          action="mailto:support@edumanager.example?subject=EduManager%20demo%20request"
          className="grid gap-6 p-8 sm:p-12"
          encType="text/plain"
          method="post"
        >
          <div className="grid gap-2">
            <Label htmlFor="institution-name">
              Institution Name <span aria-hidden="true">*</span>
            </Label>
            <Input
              autoComplete="organization"
              className="h-11 rounded-md px-4"
              id="institution-name"
              name="institution"
              placeholder="e.g. Springfield High School"
              required
              type="text"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="first-name">
                First Name <span aria-hidden="true">*</span>
              </Label>
              <Input
                autoComplete="given-name"
                className="h-11 rounded-md px-4"
                id="first-name"
                name="firstName"
                placeholder="Jane"
                required
                type="text"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">
                Last Name <span aria-hidden="true">*</span>
              </Label>
              <Input
                autoComplete="family-name"
                className="h-11 rounded-md px-4"
                id="last-name"
                name="lastName"
                placeholder="Doe"
                required
                type="text"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="work-email">
                Work Email <span aria-hidden="true">*</span>
              </Label>
              <Input
                autoComplete="email"
                className="h-11 rounded-md px-4"
                id="work-email"
                name="email"
                placeholder="jane@school.edu"
                required
                type="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">
                Your Role <span aria-hidden="true">*</span>
              </Label>
              <Select name="role" required>
                <SelectTrigger
                  className="h-11 w-full rounded-md px-4"
                  id="role"
                >
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrator">School Administrator</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="it-director">IT Director</SelectItem>
                  <SelectItem value="finance-officer">Finance Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="mt-2 h-11" type="submit">
            Submit Request
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By submitting, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </Card>
    </section>
  )
}

export { DemoRequestSection }
