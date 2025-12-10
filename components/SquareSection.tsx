"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info } from "lucide-react";

export default function SquareSection() {
  return (
    <section className="container py-12 md:py-16">
      <div className="bg-neutral-light rounded-lg p-6 border border-neutral-dark/10 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="relative order-2 md:order-1">
            <div className="relative rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="/images/square-register.png"
                alt="Square register showing Bitcoin payment option"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="flex items-start gap-4">
              <Info className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 text-primary">
                  Square Bitcoin Payments (US Only)
                </h3>
                <p className="text-sm text-neutral-dark mb-4">
                  Square has integrated Bitcoin payments for US merchants, but this feature isn't available in Australia yet. 
                  Want to see it here? <a href="https://c.org/QXNPWS6DBh" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Sign the petition</a> or 
                  <a href="https://x.com/square" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium ml-1">contact Square</a> to request Australian support.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://c.org/QXNPWS6DBh" target="_blank" rel="noopener noreferrer">
                    Sign Petition <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

