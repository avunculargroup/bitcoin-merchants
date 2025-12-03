import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
        ]}
      />
      <div className="container py-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">About Aussie Bitcoin Merchants</h1>

        <div className="prose prose-lg max-w-none mb-12">
          <p className="text-lg text-neutral-dark mb-6">
            Welcome to Aussie Bitcoin Merchants, a website to help small retailers in join Australia's growing Bitcoin economy. We're here to make it simple, secure, and rewarding for small businesses like yours to start accepting Bitcoin payments and connect with a vibrant new community of customers.
          </p>

          <h2 className="text-2xl font-semibold mb-4 mt-8">Our Mission</h2>
          <p className="text-neutral-dark mb-6">
            Our mission is to strengthen the Australian Bitcoin ecosystem by empowering local businesses. We believe that bitcoin is more than just an asset; it's a powerful tool for financial sovereignty, borderless commerce, and building stronger local economies. By helping merchants onboard, we're not just facilitating payments — we're helping to build the future of Australian commerce, one business at a time.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Our Story: A Fusion of Technical Innovation & Strategic Clarity</h2>
          <p className="text-neutral-dark mb-8">
            Aussie Bitcoin Merchants is led by Carri and Chris, directors of the Avuncular Group. We bring together two distinct but complementary worlds: deep technical expertise and high-impact strategic communication. This unique combination is what allows us to make Bitcoin onboarding genuinely accessible for Australian small business owners.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-neutral-light p-6 rounded-lg shadow-md">
              <div className="flex flex-col items-center mb-4">
                <Image
                  src="/images/chris_profile.jpeg"
                  alt="Chris"
                  width={150}
                  height={150}
                  className="rounded-full object-cover mb-4"
                />
                <h3 className="text-xl font-semibold text-center">Chris: Building the Open Data Foundation</h3>
              </div>
              <p className="text-neutral-dark">
                Chris's path to Bitcoin was forged through a passion for open, decentralised systems. After a career in project management, he retrained as a software engineer, with his first role deeply involved in <strong>open mapping data</strong>. There, he saw how collaborative, transparent systems like OpenStreetMap could create immense public value.
              </p>
              <p className="text-neutral-dark mt-4">
                When he discovered Bitcoin, he recognised those same powerful principles at work. He saw that for bitcoin to thrive as a day-to-day currency in Australia, it needed a robust, open data ecosystem. The project <strong><Link href="https://btcmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BTCMap.org</Link></strong> — which plots bitcoin-friendly merchants on an open map — was the perfect link, connecting his expertise in open data with his passion for Bitcoin.
              </p>
            </div>
            <div className="bg-neutral-light p-6 rounded-lg shadow-md">
              <div className="flex flex-col items-center mb-4">
                <Image
                  src="/images/carri - recent selfie.jpg"
                  alt="Carri"
                  width={150}
                  height={150}
                  className="rounded-full object-cover mb-4"
                />
                <h3 className="text-xl font-semibold text-center">Carri: Translating Complexity into Confidence</h3>
              </div>
              <p className="text-neutral-dark mb-4">
                For over 30 years, Carri has specialised in one thing: turning complex, technical information into powerful, persuasive messages. She has coached executives and technical experts to communicate with clarity, authority, and impact in high-stakes situations.
              </p>
              <p className="text-neutral-dark">
                Through their other venture, <strong>Bitcoin Treasury Solutions</strong>, Carri already advises SMEs and financial professionals on the strategic, real-world application of Bitcoin — not as "internet magic money," but as a serious treasury asset and the base layer of a new financial system. She brings this same skill for cutting through the noise to Aussie Bitcoin Merchants. Her focus is on making the entire process of accepting Bitcoin feel simple, safe, and strategic for you, ensuring you understand the "why" as clearly as the "how."
              </p>
            </div>


          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Small Businesses Matter</h2>
          <p className="text-neutral-dark mb-4">
            We believe that:
          </p>
          <ul className="list-disc list-inside text-neutral-dark space-y-2 mb-6">
            <li><strong>Small Businesses are the Backbone of Australia:</strong> Supporting you means supporting local communities.</li>
            <li><strong>Financial Choice is a Right:</strong> You and your customers deserve access to modern, global payment systems.</li>
            <li><strong>Open Data Empowers Everyone:</strong> By adding your business to the bitcoin map, you're contributing to a shared resource that helps the entire ecosystem grow.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Join Us on This Journey</h2>
          <p className="text-neutral-dark mb-6">
            We're excited to help you tap into a new market, reduce payment costs, and be part of a forward-thinking community. We guide you through the technical setup while you focus on what you do best: running your business.
          </p>
        
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">— Carri & Chris</p>
            <p className="text-neutral-dark">Directors, Avuncular Group</p>
          </div>
        </section>

        <section className="bg-primary/5 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-semibold mb-4">Ready to get started?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/map">Add Your Business to the Map</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Contact Us with Questions</Link>
            </Button>
          </div>
        </section>
      </div>
      </div>
    </>
  );
}

