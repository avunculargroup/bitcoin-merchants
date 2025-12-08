"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import LegacySubmitForm from "@/components/forms/LegacySubmitForm";
import TypeformLikeForm from "@/components/forms/TypeformLikeForm";
import { env } from "@/lib/env";

export default function SubmitPage() {
  const isTypeformEnabled = env.typeformWizardEnabled;
  const baseUrl = env.appUrl;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Business Registration Service",
    description: "Free service to register Australian businesses accepting Bitcoin payments on OpenStreetMap and BTCMap",
    provider: {
      "@type": "Organization",
      name: "Aussie Bitcoin Merchants",
      url: baseUrl,
    },
    areaServed: {
      "@type": "Country",
      name: "Australia",
    },
    serviceType: "Business Listing",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "AUD",
    },
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Add Your Business", href: "/submit" },
        ]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      {isTypeformEnabled ? <TypeformLikeForm /> : <LegacySubmitForm />}
    </>
  );
}
