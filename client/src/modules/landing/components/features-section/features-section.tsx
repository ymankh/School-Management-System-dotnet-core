import { BookOpenCheck, LineChart, MessageSquareText, ShieldCheck } from "lucide-react"

import { Badge } from "@/shared/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { cn } from "@/shared/lib/utils"

const features = [
  {
    title: "Centralized Admin Portal",
    description:
      "Manage staff, resources, and institutional data from a single, high-density dashboard designed for fast retrieval and minimal cognitive load.",
    icon: ShieldCheck,
    accent: "bg-primary/10 text-primary",
    className: "lg:col-span-2",
    tags: ["Role-based Access", "Audit Logs"],
  },
  {
    title: "Student Tracking",
    description:
      "Real-time analytics on attendance, behavior, and academic progression.",
    icon: LineChart,
    accent: "bg-secondary text-secondary-foreground",
  },
  {
    title: "Automated Grading",
    description:
      "Reduce educator workload with bulk grading tools and integrated rubric assessments.",
    icon: BookOpenCheck,
    accent: "bg-muted text-muted-foreground",
  },
  {
    title: "Unified Parent Communication",
    description:
      "Secure messaging, automated broadcast alerts, and transparent progress sharing bridge the gap between classroom and home.",
    icon: MessageSquareText,
    accent: "bg-accent text-accent-foreground",
    className: "lg:col-span-2",
  },
]

function FeaturesSection() {
  return (
    <section className="bg-background px-5 py-24 sm:px-6 lg:px-8" id="features">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-normal text-foreground">
            Academic Precision, Simplified
          </h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Our modular architecture adapts to your institution's specific workflows,
            replacing chaotic spreadsheets with organized clarity.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              className={cn(
                "min-h-64 rounded-lg border border-border bg-card p-8 ring-0",
                feature.className,
              )}
              key={feature.title}
            >
              <CardHeader className="p-0">
                <div className={cn("grid size-12 place-items-center rounded-md", feature.accent)}>
                  <feature.icon className="size-5" aria-hidden="true" />
                </div>
                <CardTitle className="mt-8 text-xl font-semibold text-foreground">
                  {feature.title}
                </CardTitle>
                <CardDescription className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              {feature.tags ? (
                <CardContent className="mt-4 flex flex-wrap gap-2 p-0">
                  {feature.tags.map((tag) => (
                    <Badge
                      className="rounded px-2 py-1 text-xs"
                      key={tag}
                      variant="secondary"
                    >
                      {tag}
                    </Badge>
                  ))}
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export { FeaturesSection }
