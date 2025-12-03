import type { Metadata } from "next";
import { env } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = env.appUrl;
  const pathname = "/about";
  
  return {
    title: "About Us - Aussie Bitcoin Merchants | Our Mission & Story",
    description: "Learn about Aussie Bitcoin Merchants, our mission to strengthen Australia's Bitcoin ecosystem, and the team behind the project.",
    alternates: {
      canonical: `${baseUrl}${pathname}`,
      languages: {
        'en-AU': `${baseUrl}${pathname}`,
      },
    },
    openGraph: {
      title: "About Us - Aussie Bitcoin Merchants | Our Mission & Story",
      description: "Learn about Aussie Bitcoin Merchants, our mission to strengthen Australia's Bitcoin ecosystem, and the team behind the project.",
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
      title: "About Us - Aussie Bitcoin Merchants | Our Mission & Story",
      description: "Learn about Aussie Bitcoin Merchants, our mission to strengthen Australia's Bitcoin ecosystem, and the team behind the project.",
      images: [`${baseUrl}/images/og.png`],
    },
  };
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

