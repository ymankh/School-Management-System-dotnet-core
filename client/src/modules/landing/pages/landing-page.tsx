import { DemoRequestSection } from "@/modules/landing/components/demo-request-section"
import { FeaturesSection } from "@/modules/landing/components/features-section"
import { HeroSection } from "@/modules/landing/components/hero-section"
import { PricingSection } from "@/modules/landing/components/pricing-section"
import { SiteFooter } from "@/modules/landing/components/site-footer"
import { SiteHeader } from "@/modules/landing/components/site-header"

function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <DemoRequestSection />
      <SiteFooter />
    </main>
  )
}

export { LandingPage }
