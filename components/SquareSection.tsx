"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink } from "lucide-react";
import { FaXTwitter, FaFacebook, FaInstagram } from "react-icons/fa6";

export default function SquareSection() {
  const features = [
    "No processing fees until 2027. Merchants can accept bitcoin with zero fees during the launch period.",
    "Instant payments. Transactions use the Lightning Network for near‑instant settlement.",
    "Flexible payout options. Sellers can receive funds as bitcoin or automatically convert some or all of the sale to fiat currency.",
    "No chargebacks. Bitcoin transactions are irreversible.",
  ];

  return (
    <section className="container py-16 md:py-20 bg-neutral">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Accepting bitcoin with Square</h2>
            <p className="text-lg text-neutral-dark mb-6">
              Square (a subsidiary of Block) has integrated bitcoin directly into its point‑of‑sale system for U.S. merchants. From 10 November 2025, roughly <strong>4 million U.S. Square merchants</strong> can accept bitcoin payments directly in their terminals. Key features include:
            </p>
          </div>
          <div className="relative">
            <div className="relative rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/images/square-register.png"
                alt="Square register showing Bitcoin payment option"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
        <ul className="space-y-4 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-secondary mt-1 flex-shrink-0" />
              <span className="text-neutral-dark">{feature}</span>
            </li>
          ))}
        </ul>
        <div className="bg-neutral-light rounded-lg p-6 mb-8 border border-neutral-dark/10">
          <p className="text-neutral-dark mb-6">
            Currently, Square's bitcoin payments are available only in the United States. If you'd like this feature in Australia, you can help by either signing the petition or reaching out to Square directly via their social media.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-primary">Option 1: Sign the Petition</h3>
              <p className="text-sm text-neutral-dark mb-3">
                Join others in signing the petition to urge Square to bring bitcoin features to Australian devices.
              </p>
              <Button variant="default" className="bg-accent hover:bg-accent-dark text-white" asChild>
                <a href="https://c.org/QXNPWS6DBh" target="_blank" rel="noopener noreferrer">
                  Sign the Petition <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            
            <div className="border-t border-neutral-dark/20 pt-4">
              <h3 className="font-semibold text-lg mb-2 text-primary">Option 2: Contact Square Directly</h3>
              <p className="text-sm text-neutral-dark mb-3">
                Reach out to Square on social media and let them know you want bitcoin payments in Australia. Tag them in a post or send them a message.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://x.com/square"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <FaXTwitter className="h-4 w-4" />
                    <span>X (Twitter)</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://www.facebook.com/square"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <FaFacebook className="h-4 w-4" />
                    <span>Facebook</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://www.instagram.com/square"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <FaInstagram className="h-4 w-4" />
                    <span>Instagram</span>
                    <ExternalLink className="h-3 w-3" />
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

