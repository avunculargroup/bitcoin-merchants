"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Shield, MapPin } from "lucide-react";

export default function HomeHero() {
  return (
    <section className="container py-20 md:py-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="mb-6">
            <Image
              src="/images/aussie_bitcoin_merchants.png"
              alt="Aussie Bitcoin Merchants"
              width={240}
              height={53}
              className="h-12 w-auto mb-4"
            />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-primary">
            Who needs a 3% card fee?
          </h1>
          <p className="text-xl text-neutral-dark mb-6">
            Traditional card payments are expensive for small merchants - fees often exceed{" "}
            <strong>1½-2%</strong> of the sale value, and transactions on foreign‑issued cards can cost{" "}
            <strong>around 2.5%</strong>. When the median profit margin for an Australian small business is only{" "}
            <strong>≈5%</strong> and average net margins range from <strong>7-10%</strong>, paying two percent in fees means handing over a large share of your hard‑earned profit.
          </p>
          <p className="text-lg text-neutral-dark mb-8">
            Bitcoin payments can be processed via the Lightning Network with negligible fees and no intermediaries.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button size="lg" asChild>
              <Link href="/submit">Register Your Business</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/map#how-it-works">Learn More</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 text-sm text-neutral-dark">
              <Shield className="h-5 w-5 text-primary" />
              <span>HTTPS Secure</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-dark">
              <MapPin className="h-5 w-5 text-secondary" />
              <span>100% Australian Owned</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden h-64 md:h-96 shadow-xl">
            <Image
              src="/images/blake-wisz-tE6th1h6Bfk-unsplash.jpg"
              alt="Bitcoin payment illustration"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

