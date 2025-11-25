"use client";

import Image from "next/image";
import { Smartphone, Globe } from "lucide-react";

interface POSOption {
  name: string;
  description: string;
  platforms: string[];
  link?: string;
  imagePath?: string;
}

export default function POSOptions() {
  const options: POSOption[] = [
    {
      name: "Wallet of Satoshi",
      description:
        "A popular Lightning wallet that also works as a POS system. It's Australian‑owned and available for Android and iOS. Customers pay via QR code; merchants can quickly send funds to their bank or keep them in bitcoin.",
      platforms: ["Android", "iOS"],
      imagePath: "/images/wallet-of-satoshi-logo.svg",
    },
    {
      name: "Bitaroo POS",
      description:
        "Bitaroo offers a POS app for Android and iOS that lets merchants accept bitcoin over the Lightning Network. Bitaroo is an Australian exchange with local support.",
      platforms: ["Android", "iOS"],
      imagePath: "/images/bitaroo-logo.svg",
    },
    {
      name: "IBEX Pay",
      description:
        "An international Lightning payment processor that provides POS hardware and web apps for accepting bitcoin. Settlements can be in bitcoin or converted to fiat.",
      platforms: ["Web"],
      imagePath: "/images/ibex-logo.svg",
    },
    {
      name: "Blink",
      description:
        "A payment provider offering a simple interface to accept bitcoin payments on‑site or online.",
      platforms: ["Web"],
      imagePath: "/images/blink-logo.svg",
    },
    {
      name: "Manna",
      description:
        "Manna Bitcoin provides tools for merchants to accept bitcoin quickly and securely.",
      platforms: ["Web"],
      imagePath: "/images/manna-logo.png",
    },
  ];

  return (
    <section className="container py-16 md:py-20">
      <h2 className="text-3xl md:text-4xl font-bold mb-6">Accepting bitcoin over the counter</h2>
      <p className="text-lg text-neutral-dark mb-8 max-w-3xl">
        Australian merchants already have several point‑of‑sale (POS) options that enable lightning‑fast bitcoin payments. Most POS apps integrate with your existing phone or tablet, so you don't need special hardware. They generate a Lightning invoice and display a QR code for customers to scan; payments are instant and often cost only a few satoshis.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {options.map((option, index) => (
          <div
            key={index}
            className="bg-neutral-light rounded-lg p-6 border border-neutral-dark/10 hover:shadow-lg transition-shadow relative"
          >
            <div
              className={`rounded-lg p-4 h-32 mb-4 flex items-center justify-center overflow-hidden relative ${
                option.name === "Bitaroo POS"
                  ? "bg-orange-500"
                  : option.name === "Manna"
                  ? "bg-[#5656e6]"
                  : option.name === "Blink"
                  ? "bg-[#1a1a1a]"
                  : "bg-neutral"
              }`}
            >
              {(option.name === "Wallet of Satoshi" || option.name === "Bitaroo POS") && (
                <div className="absolute -top-2 -left-2 z-10 bg-white border-2 border-primary rounded-full px-2 py-1 shadow-md flex items-center gap-1 text-xs font-semibold text-primary">
                  <span>🇦🇺</span>
                  <span>Australian Made</span>
                </div>
              )}
              {option.imagePath ? (
                <Image
                  src={option.imagePath}
                  alt={`${option.name} logo`}
                  width={option.name === "Wallet of Satoshi" ? 260 : 200}
                  height={option.name === "Wallet of Satoshi" ? 104 : 80}
                  className="object-contain max-h-full max-w-full"
                />
              ) : (
                <p className="text-neutral-dark text-sm text-center font-semibold">
                  {option.name}
                </p>
              )}
            </div>
            <h3 className="text-xl font-semibold mb-3">{option.name}</h3>
            <p className="text-neutral-dark mb-4 text-sm leading-relaxed">{option.description}</p>
            <div className="flex flex-wrap gap-2">
              {option.platforms.map((platform) => (
                <span
                  key={platform}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {platform === "Android" || platform === "iOS" ? (
                    <Smartphone className="h-3 w-3" />
                  ) : (
                    <Globe className="h-3 w-3" />
                  )}
                  {platform}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

