import type { Metadata } from "next";
import { env } from "@/lib/env";
import Breadcrumbs from "@/components/Breadcrumbs";
import Hero from "@/components/Hero";
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
      <section className="mx-auto mt-16 w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg backdrop-blur">
          <h2 className="text-3xl font-semibold text-slate-900">The BTC Map</h2>
          <p className="mt-4 text-lg text-slate-600">
            BTC Map is a volunteer-run directory of Bitcoin-friendly businesses
            built entirely on open, community-maintained OpenStreetMap data, so
            anyone can discover and verify places that welcome Bitcoin without
            needing proprietary apps.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="relative w-full pt-[70%] sm:pt-[60%] lg:pt-[45%]">
              <iframe
                id="btcmap"
                title="BTC Map"
                width="100%"
                height="100%"
                allow="geolocation"
                allowFullScreen={true}
                loading="lazy"
                src="https://btcmap.org/map#16/-37.79677/144.99403"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      </section>
      <StepByStep />
      <Benefits showTestimonials={false} />
      <TrustBadges />
      <ContactSupportCard />
      <FAQ />
    </main>
  );
}

