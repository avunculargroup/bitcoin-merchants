"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t bg-neutral-light">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Link href="/" className="inline-block">
                <Image
                  src="/images/aussie_bitcoin_merchants.png"
                  alt="Aussie Bitcoin Merchants"
                  width={180}
                  height={40}
                  className="h-8 w-auto"
                />
              </Link>
              <span className="text-lg font-semibold text-neutral-dark">
                Aussie Bitcoin Merchants
              </span>
            </div>
            <p className="text-sm text-neutral-dark">
              Helping Australian businesses get on the Bitcoin map.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#how-it-works" className="text-neutral-dark hover:text-primary">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-neutral-dark hover:text-primary">
                  Add Your Business
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-neutral-dark hover:text-primary">
                  Resources
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-neutral-dark hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-neutral-dark hover:text-primary">
                  Terms of Use
                </Link>
              </li>
            </ul>
            <Link
              href="https://openstreetmap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-dark hover:text-primary inline-block mt-3"
            >
              OpenStreetMap
            </Link>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-neutral-dark">
              <li>Email: info@bitcoinmerchants.com.au</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-neutral-dark">
          <p>Built on open data (OpenStreetMap)</p>
          <p className="mt-1 text-xs">Geocoding powered by OpenStreetMap Nominatim</p>
          <p className="mt-1 text-xs">
            Supporting the{" "}
            <Link href="https://btcmap.org" target="_blank" rel="noopener noreferrer" className="underline">
              BTCMap project
            </Link>
          </p>
          <p className="mt-2 text-xs">
            Website managed by Avuncular Group Pty Ltd, an Aussie company dedicated to supporting
            bitcoin education.
          </p>
        </div>
      </div>
    </footer>
  );
}

