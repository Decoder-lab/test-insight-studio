import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import WhatWeTestSection from "@/components/landing/WhatWeTestSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import NeuroScoreFramework from "@/components/landing/NeuroScoreFramework";
import SampleResultsSection from "@/components/landing/SampleResultsSection";
import ScientificFoundation from "@/components/landing/ScientificFoundation";
import PricingSection from "@/components/landing/PricingSection";
import ConsultationSection from "@/components/landing/ConsultationSection";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";
import StickyBottomCTA from "@/components/landing/StickyBottomCTA";

const Index = () => {
  return (
    <div className="min-h-screen pb-16">
      {/* Skip to main content link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent focus:text-accent-foreground focus:px-4 focus:py-2 focus:rounded-md focus:font-semibold"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
      <HeroSection />
      <WhatWeTestSection />
      <HowItWorksSection />
      <NeuroScoreFramework />
      <SampleResultsSection />
      <ScientificFoundation />
      <PricingSection />
      <ConsultationSection />
      <FAQSection />
      </main>
      <Footer />
      <StickyBottomCTA />
    </div>
  );
};

export default Index;
