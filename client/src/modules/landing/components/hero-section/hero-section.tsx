import { ArrowRight, BarChart3, CirclePlay } from "lucide-react"

import heroImage from "@/assets/images/education-dashboard-hero.png"
import { Avatar, AvatarFallback, AvatarGroup } from "@/shared/components/ui/avatar"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { cn } from "@/shared/lib/utils"

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 -z-10 bg-muted/30" />
      <div className="mx-auto grid min-h-[690px] max-w-7xl items-center gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[0.94fr_1.06fr] lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-normal text-foreground sm:text-6xl lg:text-7xl">
            The Ultimate Solution for{" "}
            <span className="text-primary">Modern Schools</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Streamline administration, empower educators, and enhance student
            outcomes with our comprehensive, quiet-UI academic management platform.
            Built for precision.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button className="h-11 px-6">
              Start Free Trial
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button className="h-11 gap-2 px-6" variant="outline">
              View Demo
              <CirclePlay className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-12 flex items-center gap-4 text-sm text-muted-foreground">
            <AvatarGroup>
              {["MS", "AK", "JD"].map((name, index) => (
                <Avatar
                  className={cn(
                    "text-[10px] font-semibold text-foreground",
                    ["bg-muted", "bg-secondary", "bg-accent"][index],
                  )}
                  key={name}
                >
                  <AvatarFallback className="bg-transparent text-[10px] font-semibold text-foreground">
                    {name}
                  </AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
            <span>Trusted by 500+ academic institutions globally.</span>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-lg border border-border bg-muted shadow-xl">
            <img
              alt="EduManager dashboard shown on a laptop"
              className="aspect-[4/3] w-full object-cover"
              src={heroImage}
            />
          </div>
          <Card className="absolute -bottom-7 left-4 flex-row items-center gap-4 rounded-md border-border bg-card px-5 py-4 shadow-lg ring-0 sm:left-[-24px]">
            <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
              <BarChart3 className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Attendance Rate</p>
              <p className="text-xl font-semibold text-foreground">98.4%</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

export { HeroSection }
