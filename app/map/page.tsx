import Hero from "@/components/Hero";
import StepByStep from "@/components/StepByStep";
import Benefits from "@/components/Benefits";
import TrustBadges from "@/components/TrustBadges";
import FAQ from "@/components/FAQ";
import ContactSupportCard from "@/components/ContactSupportCard";

export default function MapPage() {
  return (
    <main>
      <Hero />
      <StepByStep />
      <Benefits showTestimonials={false} />
      <TrustBadges />
      <ContactSupportCard />
      <FAQ />
    </main>
  );
}

