"use client";

import { Zap, Shield, DollarSign, TrendingUp } from "lucide-react";

export default function WhyBitcoin() {
  const benefits = [
    {
      icon: Zap,
      title: "Instant settlement",
      description:
        "Bitcoin payments over the Lightning Network settle almost instantly. Off‑chain payment channels allow high‑volume, low‑fee transfers, so money reaches you in seconds rather than days. Payment processors like OpenNode even offer near‑instant settlement and automatic conversion to local currencies.",
    },
    {
      icon: Shield,
      title: "No fraud or chargebacks",
      description:
        "Bitcoin transactions are final. Each transaction is recorded on a public blockchain and cannot be reversed, eliminating chargebacks and the associated fraud risk. Payment processors emphasise that accepting bitcoin means saying goodbye to fraud and chargebacks.",
    },
    {
      icon: DollarSign,
      title: "Virtually no fees",
      description:
        "Lightning transactions carry very low network fees, and some processors offer zero processing fees for a promotional period. For example, Square's U.S. rollout of Bitcoin payments allows merchants to accept bitcoin with no processing fees until 2027.",
    },
    {
      icon: TrendingUp,
      title: "Protect your margin",
      description:
        "Small businesses in Australia typically operate on slim profit margins. The median operating profit margin is only about 5%, and a 2024 benchmark shows many small businesses have net margins under 10%. Card payment fees ranging from 1.5-2% for domestic cards and around 2.5% for foreign cards can erode a third of your profit. Accepting bitcoin allows you to keep more of what you earn.",
    },
  ];

  return (
    <section className="container py-16 md:py-20">
      <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Why accept bitcoin?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
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
                  <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                  <p className="text-neutral-dark leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

