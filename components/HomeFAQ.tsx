"use client";

import * as React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is bitcoin?",
    answer: (
      <>
        Bitcoin is a digital currency that works through a <strong>peer‑to‑peer network</strong>, meaning users transact directly with one another without intermediaries. Each node in the network keeps a copy of the public ledger (the blockchain) and uses <strong>cryptography to verify transactions</strong>, ensuring that coins cannot be spent twice.
      </>
    ),
  },
  {
    question: "How do bitcoin payments work?",
    answer: (
      <>
        Payments can be made on‑chain or via the Lightning Network. Lightning is a second‑layer protocol that allows many off‑chain transfers before settling on the blockchain. It enables <strong>fast, scalable transactions with very low fees</strong>, making micro‑payments practical. A POS or payment processor generates a Lightning invoice (usually as a QR code). The customer scans and pays; funds are available instantly.
      </>
    ),
  },
  {
    question: "What are the fees?",
    answer: (
      <>
        Card payment fees for small merchants in Australia typically range from <strong>1.5% to 2%</strong>, and transactions on foreign cards cost <strong>around 2.5%</strong>. In contrast, Lightning network fees are tiny. Some processors charge less than a cent, and Square even offers <strong>zero processing fees until 2027</strong>. Eliminating card fees helps protect your slim profit margins.
      </>
    ),
  },
  {
    question: "Are bitcoin payments volatile?",
    answer: (
      <>
        Bitcoin's price can fluctuate. However, many payment processors (including Square's U.S. service and OpenNode) offer automatic conversion to local currency at the time of payment. You can choose to receive funds in bitcoin, in your local currency, or a mix of both, reducing exposure to price volatility.
      </>
    ),
  },
  {
    question: "Are there chargebacks?",
    answer: (
      <>
        No. Bitcoin transactions are cryptographically signed and recorded on a decentralised blockchain, making them <strong>immutable</strong> and irreversible. This eliminates the risk of fraudulent chargebacks and reduces administrative overhead.
      </>
    ),
  },
];

export default function HomeFAQ() {
  return (
    <section id="faq" className="container py-16 md:py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
        Frequently Asked Questions
      </h2>
      <Accordion.Root type="single" collapsible className="max-w-3xl mx-auto">
        {faqs.map((faq, index) => (
          <Accordion.Item
            key={index}
            value={`item-${index}`}
            className="border-b border-neutral-dark/10"
          >
            <Accordion.Header>
              <Accordion.Trigger className="flex w-full items-center justify-between py-4 text-left font-semibold hover:text-primary transition-colors group">
                {faq.question}
                <ChevronDown className="h-5 w-5 text-neutral-dark transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="pb-4 text-neutral-dark leading-relaxed">
              {faq.answer}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
}

