import type { Metadata } from "next";
import { env } from "@/lib/env";
import HomeHero from "@/components/HomeHero";
import WhyBitcoin from "@/components/WhyBitcoin";
import GetOnMap from "@/components/GetOnMap";
import MeetTeamCard from "@/components/MeetTeamCard";
import SquareSection from "@/components/SquareSection";
import POSOptions from "@/components/POSOptions";
import OnlinePayment from "@/components/OnlinePayment";
import HomeFAQ from "@/components/HomeFAQ";
import ContactSupportCard from "@/components/ContactSupportCard";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = env.appUrl;
  
  return {
    title: "Aussie Bitcoin Merchants - Accept Bitcoin Payments | Low Fees, No Chargebacks",
    description: "Accept Bitcoin payments with negligible fees and no chargebacks. Register your Australian business on the Bitcoin Map. Join hundreds of merchants accepting Bitcoin via Lightning Network.",
    alternates: {
      canonical: baseUrl,
      languages: {
        'en-AU': baseUrl,
      },
    },
    openGraph: {
      title: "Aussie Bitcoin Merchants - Accept Bitcoin Payments | Low Fees, No Chargebacks",
      description: "Accept Bitcoin payments with negligible fees and no chargebacks. Register your Australian business on the Bitcoin Map. Join hundreds of merchants accepting Bitcoin via Lightning Network.",
      url: baseUrl,
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
      title: "Aussie Bitcoin Merchants - Accept Bitcoin Payments | Low Fees, No Chargebacks",
      description: "Accept Bitcoin payments with negligible fees and no chargebacks. Register your Australian business on the Bitcoin Map.",
      images: [`${baseUrl}/images/og.png`],
    },
  };
}

export default function Home() {
  const baseUrl = env.appUrl;
  
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Aussie Bitcoin Merchants",
    "url": baseUrl,
    "logo": `${baseUrl}/images/aussie_bitcoin_merchants.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "info@bitcoinmerchants.com.au",
      "contactType": "Customer Service",
    },
    "sameAs": [
      "https://github.com/avunculargroup/bitcoin-merchants",
      "https://btcmap.org",
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is bitcoin?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Bitcoin is a digital currency that works through a peer‑to‑peer network, meaning users transact directly with one another without intermediaries. Each node in the network keeps a copy of the public ledger (the blockchain) and uses cryptography to verify transactions, ensuring that coins cannot be spent twice.",
        },
      },
      {
        "@type": "Question",
        "name": "How do bitcoin payments work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Payments can be made on‑chain or via the Lightning Network. Lightning is a second‑layer protocol that allows many off‑chain transfers before settling on the blockchain. It enables fast, scalable transactions with very low fees, making micro‑payments practical. A POS or payment processor generates a Lightning invoice (usually as a QR code). The customer scans and pays; funds are available instantly.",
        },
      },
      {
        "@type": "Question",
        "name": "What are the fees?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Card payment fees for small merchants in Australia typically range from 1.5% to 2%, and transactions on foreign cards cost around 2.5%. In contrast, Lightning network fees are tiny. Some processors charge less than a cent, and Square even offers zero processing fees until 2027. Eliminating card fees helps protect your slim profit margins.",
        },
      },
      {
        "@type": "Question",
        "name": "Are bitcoin payments volatile?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Bitcoin's price can fluctuate. However, many payment processors (including Square's U.S. service and OpenNode) offer automatic conversion to local currency at the time of payment. You can choose to receive funds in bitcoin, in your local currency, or a mix of both, reducing exposure to price volatility.",
        },
      },
      {
        "@type": "Question",
        "name": "Are there chargebacks?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Bitcoin transactions are cryptographically signed and recorded on a decentralised blockchain, making them immutable and irreversible. This eliminates the risk of fraudulent chargebacks and reduces administrative overhead.",
        },
      },
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HomeHero />
      <WhyBitcoin />
      <GetOnMap />
      <SquareSection />
      <POSOptions />
      <MeetTeamCard />
      <OnlinePayment />
      <ContactSupportCard />
      <HomeFAQ />
    </main>
  );
}
