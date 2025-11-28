import Link from "next/link";

export default function ResourcesPage() {
  return (
    <div className="container py-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Resources</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">About Bitcoin</h2>
          <p className="text-neutral-dark mb-4">
            Bitcoin is a decentralised digital currency that enables peer-to-peer transactions without the need for intermediaries like banks. It was created in 2009 and has since grown into a global payment network.
          </p>
          <p className="text-neutral-dark mb-4">
            Businesses accepting Bitcoin can reach a growing community of users who prefer to use cryptocurrency for payments. Bitcoin transactions can be made on-chain (recorded on the blockchain) or via the Lightning Network (faster, lower-cost transactions).
          </p>
          <ul className="list-disc list-inside text-neutral-dark space-y-2">
            <li><Link href="https://bitcoin.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Bitcoin.org - Official Bitcoin website</Link></li>
            <li><Link href="https://lightning.network" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Lightning Network - Fast Bitcoin payments</Link></li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">About OpenStreetMap</h2>
          <p className="text-neutral-dark mb-4">
            OpenStreetMap (OSM) is a collaborative project to create a free, editable map of the world. It's built by volunteers and is released under the Open Database License (ODbL).
          </p>
          <p className="text-neutral-dark mb-4">
            Your business information is stored on OpenStreetMap, ensuring it's part of a global, open dataset that can be used by anyone. This means your listing will be available on <Link href="https://btcmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BTCMap</Link> and many other services that use OSM data.
          </p>
          <ul className="list-disc list-inside text-neutral-dark space-y-2">
            <li><Link href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenStreetMap.org - View and edit the map</Link></li>
            <li><Link href="https://wiki.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OSM Wiki - Documentation and guides</Link></li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">About <Link href="https://btcmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BTCMap</Link></h2>
          <p className="text-neutral-dark mb-4">
            <Link href="https://btcmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BTCMap</Link> is a project that helps Bitcoin users find businesses and services that accept Bitcoin. It uses OpenStreetMap data to display locations on an interactive map.
          </p>
          <p className="text-neutral-dark mb-4">
            By listing your business through this portal, you're making it easier for Bitcoin users to discover and support your business. Your listing will appear on <Link href="https://btcmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BTCMap</Link> once it's been added to OpenStreetMap.
          </p>
          <ul className="list-disc list-inside text-neutral-dark space-y-2">
            <li><Link href="https://btcmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BTCMap.org - View the Bitcoin map</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Getting Started with Bitcoin</h2>
          <p className="text-neutral-dark mb-4">
            If you're new to accepting Bitcoin, here are some resources to help you get started:
          </p>
          <ul className="list-disc list-inside text-neutral-dark space-y-2">
            <li>Choose a Bitcoin payment processor (e.g., BTCPay Server, Strike, or others)</li>
            <li>Set up a Bitcoin wallet to receive payments</li>
            <li>Display Bitcoin acceptance signage at your business</li>
            <li>Train your staff on how to process Bitcoin payments</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

