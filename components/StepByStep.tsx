"use client";

import { Search, Edit, CheckCircle } from "lucide-react";

export default function StepByStep() {
  const steps = [
    {
      icon: Search,
      title: "Search your business",
      description: "Search for your business using our integrated lookup. This step is optional - you can add missing businesses manually.",
    },
    {
      icon: Edit,
      title: "Enter details & verify",
      description: "Review pre-populated details or fill in your business name, address, category, and Bitcoin payment acceptance details. Use our secure, accessible form with ALTCHA for spam prevention.",
    },
    {
      icon: CheckCircle,
      title: "Submit & get listed",
      description: "Your submission will be reviewed and uploaded to OpenStreetMap. We'll set clear expectations about review time and ensure your data is handled responsibly.",
    },
  ];

  return (
    <section id="how-it-works" className="container py-20 bg-neutral-light">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
        How It Works
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white mb-4">
                <Icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-neutral-dark">{step.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

