"use client";

import { Zap, Shield, DollarSign, TrendingUp } from "lucide-react";

const homepageContent = {
  why_accept_bitcoin: {
    title: "Why accept bitcoin?",
    features: [
      {
        title: "Instant settlement",
        body: "Get paid in seconds with Lightning Network payments, not days. No more waiting for bank transfers to clear.",
      },
      {
        title: "No fraud or chargebacks",
        body: "Bitcoin transactions are final. Say goodbye to the cost and hassle of fraudulent chargebacks for good.",
      },
      {
        title: "Virtually no fees",
        body: "Pay mere pennies per transaction with Lightning. Keep more of your sale price without high card fees.",
      },
      {
        title: "Protect your margin",
        body: "With average Aussie business margins around 5%, saving 2-3% on fees by accepting bitcoin makes a huge difference.",
      },
    ],
  },
} as const;

const featureIcons = [Zap, Shield, DollarSign, TrendingUp] as const;

export default function WhyBitcoin() {

  return (
    <section id="why-accept-bitcoin" className="container py-16 md:py-20">
      <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
        {homepageContent.why_accept_bitcoin.title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {homepageContent.why_accept_bitcoin.features.map((feature, index) => {
          const Icon = featureIcons[index % featureIcons.length];
          return (
            <div
              key={index}
              className="bg-neutral-light rounded-lg p-6 border border-neutral-dark/10 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-neutral-dark leading-relaxed">{feature.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
