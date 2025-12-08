"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomeHero() {
  return (
    <section className="container py-20 md:py-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1">
          <div className="mb-6 hidden md:block">
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
            Card payment fees of <strong>1.5-2.5%</strong> take a big bite out of small business margins that average
            just <strong>5-10%</strong>.
          </p>
          <p className="text-lg text-neutral-dark mb-8">
            Bitcoin payments can be processed via the Lightning Network with negligible fees and no intermediaries.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button size="lg" asChild className="gap-2">
              <Link href="/map">
                <MapPin className="h-5 w-5" />
                <span>Get on the map</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#why-accept-bitcoin">Learn More</Link>
            </Button>
          </div>
        </div>
        <div className="relative order-1 lg:order-2">
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

