import { HeroSection } from "@/features/landing/hero/hero-section"
import { TrustStrip } from "@/features/landing/hero/trust-strip"
import { ProductSection } from "@/features/landing/product/product-section"
import { BenefitsSection } from "@/features/landing/benefits/benefits-section"
import { ComparisonSection } from "@/features/landing/comparison/comparison-section"
import { PersonasSection } from "@/features/landing/personas/personas-section"
import { HowItWorksSection } from "@/features/landing/how-it-works/how-it-works-section"
import { CityCtaSection } from "@/features/landing/city-cta/city-cta-section"
import { TestimonialsSection } from "@/features/landing/testimonials/testimonials-section"
import { FaqSection } from "@/features/landing/faq/faq-section"
import { WaitlistSection } from "@/features/landing/waitlist/waitlist-section"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustStrip />
      <ProductSection />
      <BenefitsSection />
      <PersonasSection />
      <ComparisonSection />
      <HowItWorksSection />
      <CityCtaSection />
      <TestimonialsSection />
      <FaqSection />
      <WaitlistSection />
    </>
  )
}
