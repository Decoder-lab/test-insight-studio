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
      <Navbar />
      <HeroSection />
      <WhatWeTestSection />
      <HowItWorksSection />
      <NeuroScoreFramework />
      <SampleResultsSection />
      <ScientificFoundation />
      <PricingSection />
      <ConsultationSection />
      <FAQSection />
      <Footer />
      <StickyBottomCTA />
    </div>
  );
};

export default Index;
