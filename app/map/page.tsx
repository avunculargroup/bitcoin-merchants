import type { Metadata } from "next";
import { env } from "@/lib/env";
import Breadcrumbs from "@/components/Breadcrumbs";
import Hero from "@/components/Hero";
import BTCMapEmbed from "@/components/BTCMapEmbed";
import StepByStep from "@/components/StepByStep";
import Benefits from "@/components/Benefits";
import TrustBadges from "@/components/TrustBadges";
import FAQ from "@/components/FAQ";
import ContactSupportCard from "@/components/ContactSupportCard";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = env.appUrl;
  const pathname = "/map";
  
  return {
    title: "Get on the Bitcoin Map - Register Your Business | Aussie Bitcoin Merchants",
    description: "Join hundreds of Aussie businesses accepting Bitcoin. Register your business on the Bitcoin Map in minutes. Built on open data (OpenStreetMap).",
    alternates: {
      canonical: `${baseUrl}${pathname}`,
      languages: {
        'en-AU': `${baseUrl}${pathname}`,
      },
    },
    openGraph: {
      title: "Get on the Bitcoin Map - Register Your Business | Aussie Bitcoin Merchants",
      description: "Join hundreds of Aussie businesses accepting Bitcoin. Register your business on the Bitcoin Map in minutes. Built on open data (OpenStreetMap).",
      url: `${baseUrl}${pathname}`,
      siteName: "Aussie Bitcoin Merchants",
      images: [
        {
          url: `${baseUrl}/images/og.png`,
          width: 1200,
          height: 630,
          alt: "Aussie Bitcoin Merchants",
        },
      ],
      locale: "en_AU",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Get on the Bitcoin Map - Register Your Business | Aussie Bitcoin Merchants",
      description: "Join hundreds of Aussie businesses accepting Bitcoin. Register your business on the Bitcoin Map in minutes.",
      images: [`${baseUrl}/images/og.png`],
    },
  };
}

export default function MapPage() {
  const baseUrl = env.appUrl;
  
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Why should I list my business?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Listing your business helps Bitcoin users find you, expanding your customer base. It's free, takes only minutes, and your data is stored openly on OpenStreetMap for long-term visibility.",
        },
      },
      {
        "@type": "Question",
        "name": "Can I edit my information later?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Once your business is listed, you can contact us to update your information. We'll help you make changes to your OpenStreetMap entry.",
        },
      },
      {
        "@type": "Question",
        "name": "How do you verify submissions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We review all submissions to ensure data quality and compliance with OpenStreetMap guidelines. Our team checks for duplicates and verifies business information before uploading.",
        },
      },
      {
        "@type": "Question",
        "name": "What if my business is not on the map?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No problem! You can manually enter your business details even if it doesn't appear in the search results. Our form allows you to add all the necessary information.",
        },
      },
    ],
  };

  return (
    <main>
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Get on the Map", href: "/map" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Hero />
      <BTCMapEmbed />
      <StepByStep />
      <Benefits showTestimonials={false} />
      <TrustBadges />
      <ContactSupportCard />
      <FAQ />
    </main>
  );
}

