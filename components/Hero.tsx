"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Shield, MapPin, CheckCircle } from "lucide-react";

export default function Hero() {
  return (
    <section className="container py-20 md:py-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Get Your Business on the Bitcoin Map in Minutes
          </h1>
          <p className="text-xl text-neutral-dark mb-8">
            Join hundreds of Aussie businesses accepting Bitcoin and bring new customers to your door.
          </p>
          <Button size="lg" asChild className="mb-8">
            <Link href="/submit">Add Your Business</Link>
          </Button>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 text-sm text-neutral-dark">
              <Shield className="h-5 w-5 text-primary" />
              <span>HTTPS Secure</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-dark">
              <MapPin className="h-5 w-5 text-secondary" />
              <span>100% Australian Owned</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-dark">
              <CheckCircle className="h-5 w-5 text-secondary" />
              <span>Built on open data (OpenStreetMap)</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden h-64 md:h-96 shadow-xl">
            <Image
              src="/images/pub.jpg"
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

