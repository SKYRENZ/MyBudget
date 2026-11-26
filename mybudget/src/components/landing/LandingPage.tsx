import { FeatureSection } from "@/components/landing/FeatureSection";
import { GetStartedSection } from "@/components/landing/GetStartedSection";
import { Hero } from "@/components/landing/Hero";
import { SiteFooter } from "@/components/layout/SiteFooter";

export function LandingPage() {
  return (
    <>
      <main className="flex flex-1 flex-col">
        <Hero />
        <FeatureSection />
        <GetStartedSection />
      </main>
      <SiteFooter />
    </>
  );
}
