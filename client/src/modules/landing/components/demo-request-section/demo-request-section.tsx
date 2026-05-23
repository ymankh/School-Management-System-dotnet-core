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

        <form className="grid gap-6 p-8 sm:p-12">
          <div className="grid gap-2">
            <Label htmlFor="institution-name">
              Institution Name *
            </Label>
            <Input
              className="h-11 rounded-md px-4"
              id="institution-name"
              placeholder="e.g. Springfield High School"
              type="text"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="first-name">
                First Name *
              </Label>
              <Input
                className="h-11 rounded-md px-4"
                id="first-name"
                placeholder="Jane"
                type="text"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">
                Last Name *
              </Label>
              <Input
                className="h-11 rounded-md px-4"
                id="last-name"
                placeholder="Doe"
                type="text"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="work-email">
                Work Email *
              </Label>
              <Input
                className="h-11 rounded-md px-4"
                id="work-email"
                placeholder="jane@school.edu"
                type="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">
                Your Role
              </Label>
              <Select>
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

          <Button className="mt-2 h-11" type="button">
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
