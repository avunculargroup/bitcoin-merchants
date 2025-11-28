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
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-neutral-dark">
              <li>
                Email:{" "}
                <a
                  href="mailto:info@bitcoinmerchants.com.au"
                  className="text-primary hover:underline"
                >
                  info@bitcoinmerchants.com.au
                </a>
              </li>
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
          <div className="mt-2 flex flex-col items-center justify-center gap-2 text-xs md:flex-row">
            <p className="text-center">
              Website managed by Avuncular Group Pty Ltd, an Aussie company dedicated to supporting bitcoin
              education.
            </p>
            <Link
              href="https://github.com/avunculargroup/bitcoin-merchants"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View the source code on GitHub (opens in a new tab)"
              title="View the source code on GitHub"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-dark/30 bg-white px-3 py-1 font-semibold uppercase tracking-wide text-[10px] text-neutral-dark transition hover:bg-neutral-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="currentColor"
                  d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.91c.58.11.79-.25.79-.57c0-.28-.01-1.03-.02-2.02c-3.2.7-3.88-1.54-3.88-1.54c-.53-1.36-1.3-1.72-1.3-1.72c-1.06-.72.08-.7.08-.7c1.17.08 1.78 1.2 1.78 1.2c1.04 1.78 2.72 1.27 3.38.97c.11-.76.4-1.27.73-1.56c-2.55-.29-5.23-1.28-5.23-5.72c0-1.26.45-2.29 1.19-3.1c-.12-.29-.52-1.45.11-3.03c0 0 .97-.31 3.18 1.18a10.9 10.9 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18c.63 1.58.23 2.74.11 3.03c.74.81 1.18 1.84 1.18 3.1c0 4.46-2.68 5.43-5.24 5.72c.41.36.77 1.07.77 2.15c0 1.55-.01 2.8-.01 3.18c0 .31.21.68.8.57A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
                />
              </svg>
              <span>Source code</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

