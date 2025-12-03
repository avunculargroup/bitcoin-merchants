import type { Metadata } from "next";
import { env } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = env.appUrl;
  const pathname = "/contact";
  
  return {
    title: "Contact Us - Aussie Bitcoin Merchants | Get Help & Support",
    description: "Contact Aussie Bitcoin Merchants for questions about Bitcoin payments, business registration, or technical support. We're here to help.",
    alternates: {
      canonical: `${baseUrl}${pathname}`,
      languages: {
        'en-AU': `${baseUrl}${pathname}`,
      },
    },
    openGraph: {
      title: "Contact Us - Aussie Bitcoin Merchants | Get Help & Support",
      description: "Contact Aussie Bitcoin Merchants for questions about Bitcoin payments, business registration, or technical support. We're here to help.",
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
      title: "Contact Us - Aussie Bitcoin Merchants | Get Help & Support",
      description: "Contact Aussie Bitcoin Merchants for questions about Bitcoin payments, business registration, or technical support.",
      images: [`${baseUrl}/images/og.png`],
    },
  };
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

