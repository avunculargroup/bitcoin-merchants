"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GetOnMap() {
  return (
    <section className="container py-16 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Get on the map</h2>
          <p className="text-lg text-neutral-dark mb-8 leading-relaxed">
            Get discovered by customers who want to pay with bitcoin. Adding your business to the Bitcoin map helps travellers and locals find you and shows you are part of a growing community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild className="gap-2">
              <Link href="/map">
                <MapPin className="h-5 w-5" />
                <span>Get on the map</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/map">Learn More</Link>
            </Button>
          </div>
        </div>
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden h-64 md:h-96 shadow-xl">
            <Image
              src="/images/maffra-btcmap.png"
              alt="Bitcoin map showing businesses accepting Bitcoin"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

