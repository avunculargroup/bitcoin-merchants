import type { Metadata } from "next";
import { env } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = env.appUrl;
  const pathname = "/submit";
  
  return {
    title: "Add Your Business - Register on Bitcoin Map | Aussie Bitcoin Merchants",
    description: "Submit your Australian business to accept Bitcoin payments. Get listed on OpenStreetMap and BTCMap. Free registration, takes only minutes.",
    alternates: {
      canonical: `${baseUrl}${pathname}`,
      languages: {
        'en-AU': `${baseUrl}${pathname}`,
      },
    },
    openGraph: {
      title: "Add Your Business - Register on Bitcoin Map | Aussie Bitcoin Merchants",
      description: "Submit your Australian business to accept Bitcoin payments. Get listed on OpenStreetMap and BTCMap. Free registration, takes only minutes.",
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
      title: "Add Your Business - Register on Bitcoin Map | Aussie Bitcoin Merchants",
      description: "Submit your Australian business to accept Bitcoin payments. Get listed on OpenStreetMap and BTCMap.",
      images: [`${baseUrl}/images/og.png`],
    },
  };
}

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

