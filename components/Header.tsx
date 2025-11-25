"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/aussie_bitcoin_merchants.png"
              alt="Aussie Bitcoin Merchants"
              width={180}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/map" className="text-sm font-medium text-neutral-dark hover:text-primary transition-colors">
              Add Your Business
            </Link>
            <Link href="/map#faq" className="text-sm font-medium text-neutral-dark hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="text-sm font-medium text-neutral-dark hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>
        </div>
        <Button asChild>
          <Link href="/submit">Register business</Link>
        </Button>
      </div>
    </header>
  );
}

