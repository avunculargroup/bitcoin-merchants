"use client";

import Image from "next/image";
import { Globe, Lock, DollarSign } from "lucide-react";

interface PaymentOption {
  name: string;
  description: string;
  features: string[];
  icon?: React.ComponentType<{ className?: string }>;
  logoPath?: string;
}

export default function OnlinePayment() {
  const options: PaymentOption[] = [
    {
      name: "BTCPay Server",
      description:
        "A free, open‑source, non‑custodial payment processor that allows you to accept bitcoin directly into your own wallet. It can be integrated into websites, WooCommerce stores, and subscription platforms.",
      features: ["Free", "Open-source", "Non-custodial", "Self-hosted"],
      logoPath: "/images/btcpay-logo.svg",
    },
    {
      name: "opennode",
      description:
        "A payment platform where businesses can accept or send Bitcoin payments instantly via the Lightning Network or on-chain, with minimal fees and no chargebacks. It offers secure hosted checkout pages, payment buttons, ecommerce plug-ins and APIs, allowing merchants to accept Bitcoin globally and convert it to local currency if desired.",
      features: ["Lightning payments", "On-chain", "Hosted checkout", "Fiat conversion"],
      logoPath: "/images/opennode-logo.svg",
    },
  ];

  return (
    <section className="container py-16 md:py-20 bg-neutral">
      <h2 className="text-3xl md:text-4xl font-bold mb-6">Accepting bitcoin online</h2>
      <p className="text-lg text-neutral-dark mb-8 max-w-3xl">
        If you run an ecommerce site or invoice clients online, several platforms can help you accept bitcoin. These solutions provide easy integration, flexible settlement options, and support for multiple currencies.
      </p>
      <div className="mb-12 max-w-4xl mx-auto">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg shadow-xl"
            src="https://www.youtube.com/embed/-GJr4XjRCPo?si=gEQ_QTfasnMrzMX8"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option, index) => {
          const Icon = option.icon;
          return (
            <div
              key={index}
              className="bg-neutral-light rounded-lg p-6 border border-neutral-dark/10 hover:shadow-lg transition-shadow"
            >
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                {option.logoPath ? (
                  <Image
                    src={option.logoPath}
                    alt={`${option.name} logo`}
                    width={40}
                    height={40}
                    className="h-6 w-auto"
                  />
                ) : Icon ? (
                  <Icon className="h-6 w-6 text-primary" />
                ) : null}
              </div>
              <h3 className="text-xl font-semibold mb-3">{option.name}</h3>
              <p className="text-neutral-dark mb-4 text-sm leading-relaxed">{option.description}</p>
              <div className="flex flex-wrap gap-2">
                {option.features.map((feature) => (
                  <span key={feature} className="text-secondary-dark text-sm font-semibold">
                    #{feature}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

