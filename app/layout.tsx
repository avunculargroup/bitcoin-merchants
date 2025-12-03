import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleMapsScript from "@/components/GoogleMapsScript";
import AltchaScript from "@/components/AltchaScript";

const inter = Inter({ subsets: ["latin"] });

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: "Aussie Bitcoin Merchants - Accept Bitcoin Payments",
  description: "Who needs a 3% card fee? Accept Bitcoin payments with negligible fees and no chargebacks. Register your Australian business on the Bitcoin Map.",
  appleWebApp: {
    title: "Accept BTC",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon0.svg", type: "image/svg+xml" },
      { url: "/icon1.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Aussie Bitcoin Merchants - Accept Bitcoin Payments",
    description: "Who needs a 3% card fee? Accept Bitcoin payments with negligible fees and no chargebacks. Register your Australian business on the Bitcoin Map.",
    url: appUrl,
    siteName: "Aussie Bitcoin Merchants",
    images: [
      {
        url: `${appUrl}/images/og.png`,
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
    title: "Aussie Bitcoin Merchants - Accept Bitcoin Payments",
    description: "Who needs a 3% card fee? Accept Bitcoin payments with negligible fees and no chargebacks.",
    images: [`${appUrl}/images/og.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GoogleMapsScript />
        <AltchaScript />
        <Header />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
