"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MeetTeamCard() {
  return (
    <section className="container pb-12">
      <div className="rounded-2xl border border-neutral-dark/10 bg-white/90 px-8 py-10 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/70">
              Team
            </p>
            <h3 className="mt-2 text-2xl font-bold text-neutral-dark">Meet the team</h3>
            <p className="mt-2 text-neutral-dark/80">
              Get to know the crew helping Aussie businesses embrace bitcoin.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/about">About the team</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
