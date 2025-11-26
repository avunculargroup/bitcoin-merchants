"use client";

import { Shield, Lock, Globe } from "lucide-react";
import Link from "next/link";

export default function TrustBadges() {
  return (
    <section className="container py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
        Security, Privacy & Trust
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Privacy-first CAPTCHA</h3>
          <p className="text-neutral-dark mb-4">
            ALTCHA protects against bots without tracking users. It uses a proof-of-work mechanism and is open-source.
          </p>
          <p className="text-sm text-neutral-dark">Open source, MIT licensed</p>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary text-white mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Data Protection</h3>
          <p className="text-neutral-dark mb-4">
            We collect only minimal data (business information and optional email). Your data is stored securely and handled responsibly.
          </p>
          <Link href="/privacy" className="text-sm text-primary hover:underline">
            Read our Privacy Policy
          </Link>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent text-white mb-4">
            <Globe className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Australian team</h3>
          <p className="text-neutral-dark mb-4">
            We're 100% Australian owned, ensuring credibility and local knowledge.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <span className="px-3 py-1 bg-primary text-white text-sm rounded">100% Australian Owned</span>
          </div>
        </div>
      </div>
    </section>
  );
}

