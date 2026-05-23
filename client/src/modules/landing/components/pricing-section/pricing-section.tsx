import { CheckCircle2 } from "lucide-react"

import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { cn } from "@/shared/lib/utils"

const pricingPlans = [
  {
    name: "Starter",
    description: "For small schools moving away from spreadsheets.",
    monthly: "$149",
    yearly: "$119",
    note: "per month",
    features: [
      "Student records",
      "Attendance tracking",
      "Parent messaging",
      "Basic reports",
    ],
  },
  {
    name: "Professional",
    description: "For growing institutions with multiple teams.",
    monthly: "$299",
    yearly: "$239",
    note: "per month",
    featured: true,
    features: [
      "Everything in Starter",
      "Role-based permissions",
      "Automated grading workflows",
      "Audit logs",
      "Priority onboarding",
    ],
  },
  {
    name: "Enterprise",
    description: "For districts and complex academic operations.",
    monthly: "Custom",
    yearly: "Custom",
    note: "annual contract",
    features: [
      "Everything in Professional",
      "Dedicated success manager",
      "Advanced integrations",
      "Custom data migration",
    ],
  },
]

function PricingSection() {
  return (
    <section className="bg-muted px-5 py-24 sm:px-6 lg:px-8" id="pricing">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-normal text-foreground">
            Pricing Built for Academic Teams
          </h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Start with the workflows you need today, then scale into deeper
            administration, reporting, and permission controls as your institution grows.
          </p>
        </div>

        <Tabs className="mt-12 items-center" defaultValue="yearly">
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>

          <TabsContent className="mt-10 w-full" value="monthly">
            <PricingCards billingCycle="monthly" />
          </TabsContent>
          <TabsContent className="mt-10 w-full" value="yearly">
            <PricingCards billingCycle="yearly" />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

type PricingCardsProps = {
  billingCycle: "monthly" | "yearly"
}

function PricingCards({ billingCycle }: PricingCardsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {pricingPlans.map((plan) => (
        <Card
          className={cn(
            "relative rounded-lg border-border bg-card p-0 ring-0",
            plan.featured && "border-primary shadow-sm",
          )}
          key={plan.name}
        >
          {plan.featured ? (
            <Badge className="absolute right-5 top-5">Most Popular</Badge>
          ) : null}

          <CardHeader className="gap-3 p-6">
            <CardTitle className="text-xl font-semibold text-foreground">
              {plan.name}
            </CardTitle>
            <CardDescription className="max-w-sm leading-6">
              {plan.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-semibold tracking-normal text-foreground">
                {plan[billingCycle]}
              </span>
              <span className="pb-1 text-sm text-muted-foreground">{plan.note}</span>
            </div>

            {billingCycle === "yearly" && plan.monthly !== "Custom" ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Billed annually. Save 20% compared with monthly billing.
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Flexible billing for teams that prefer month-to-month planning.
              </p>
            )}

            <Button className="mt-8 w-full" variant={plan.featured ? "default" : "outline"}>
              {plan.name === "Enterprise" ? "Contact Sales" : "Start Plan"}
            </Button>

            <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
              {plan.features.map((feature) => (
                <li className="flex gap-3" key={feature}>
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export { PricingSection }
