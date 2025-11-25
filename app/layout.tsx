import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleMapsScript from "@/components/GoogleMapsScript";
import AltchaScript from "@/components/AltchaScript";

const inter = Inter({ subsets: ["latin"] });

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
      </body>
    </html>
  );
}
