"use client";

import * as React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Why should I list my business?",
    answer: "Listing your business helps Bitcoin users find you, expanding your customer base. It's free, takes only minutes, and your data is stored openly on OpenStreetMap for long-term visibility.",
  },
  {
    question: "Can I edit my information later?",
    answer: "Yes! Once your business is listed, you can contact us to update your information. We'll help you make changes to your OpenStreetMap entry.",
  },
  {
    question: "How do you verify submissions?",
    answer: "We review all submissions to ensure data quality and compliance with OpenStreetMap guidelines. Our team checks for duplicates and verifies business information before uploading.",
  },
  {
    question: "What if my business is not on the map?",
    answer: "No problem! You can manually enter your business details even if it doesn't appear in the search results. Our form allows you to add all the necessary information.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="container py-20 bg-neutral-light">
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
            <Accordion.Content className="pb-4 text-neutral-dark">
              {faq.answer}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
}

