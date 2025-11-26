import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ContactSupportCard() {
  return (
    <section className="container pb-16">
      <div className="rounded-3xl bg-gradient-to-r from-[#FFC371] via-[#FF9A44] to-[#FF6D24] text-white px-8 py-10 md:px-12 shadow-[0_25px_70px_rgba(255,109,36,0.35)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
              Need help?
            </p>
            <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">
              Contact our team for more advice
            </h2>
            <p className="text-base text-white/90 md:text-lg">
              Speak directly with the BTCMap crew for tailored guidance on adding or
              updating your listing. We&apos;re here to help Australian merchants get
              live with bitcoin quickly.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-6 text-base font-semibold text-[#B34700] shadow-lg transition hover:bg-neutral-light focus-visible:ring-white/70 focus-visible:ring-offset-0"
          >
            <Link href="/contact">
              Get in touch
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

