"use client";

import { Users, Clock, Globe } from "lucide-react";

type BenefitsProps = {
  showTestimonials?: boolean;
};

export default function Benefits({ showTestimonials = true }: BenefitsProps) {
  const benefits = [
    {
      icon: Users,
      title: "Reach new customers",
      description: "Bitcoin enthusiasts look for places to spend sats; listing your business expands your audience.",
    },
    {
      icon: Clock,
      title: "Easy & free",
      description: "It takes only a few minutes and costs nothing.",
    },
    {
      icon: Globe,
      title: "Open and transparent",
      description: "Data is stored openly on OpenStreetMap, ensuring longevity and community oversight.",
    },
  ];

  return (
    <section className="container py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
        Why Add Your Business?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary text-neutral-dark mb-4">
                <Icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-neutral-dark">{benefit.description}</p>
            </div>
          );
        })}
      </div>
      {showTestimonials && (
        <div className="bg-neutral-light rounded-lg p-8">
          <h3 className="text-2xl font-semibold mb-6 text-center">What Our Users Say</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg">
              <p className="text-neutral-dark mb-4">&quot;Listing our business brought us new customers we never would have reached otherwise.&quot;</p>
              <p className="font-semibold">— Sarah Johnson</p>
              <p className="text-sm text-neutral-dark">Cafe Owner, Melbourne</p>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <p className="text-neutral-dark mb-4">&quot;The process was so simple and free. Highly recommend!&quot;</p>
              <p className="font-semibold">— Michael Chen</p>
              <p className="text-sm text-neutral-dark">Retail Store, Sydney</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

