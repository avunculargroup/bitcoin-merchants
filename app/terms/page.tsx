import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="container py-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Use</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
          <p className="text-neutral-dark mb-4">
            By using the Aussie Bitcoin Merchants portal, you agree to these Terms of Use. If you do not agree, please do not use this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Service Description</h2>
          <p className="text-neutral-dark mb-4">
            The Aussie Bitcoin Merchants portal allows Australian businesses to submit information about their Bitcoin-accepting businesses for publication on OpenStreetMap. This information is then used by <Link href="https://btcmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BTCMap</Link> and other services to display your business on maps.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">License Agreement</h2>
          <p className="text-neutral-dark mb-4">
            By submitting your business information, you agree that:
          </p>
          <ul className="list-disc list-inside text-neutral-dark space-y-2">
            <li>Your submission will be released under the Open Database License (ODbL)</li>
            <li>Your business information will be published on OpenStreetMap</li>
            <li>Your information may be used by <Link href="https://btcmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BTCMap</Link> and other services that use OpenStreetMap data</li>
            <li>You have the right to submit this information and it does not infringe on any third-party rights</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Accuracy of Information</h2>
          <p className="text-neutral-dark mb-4">
            You are responsible for ensuring that all information you submit is accurate and up-to-date. We reserve the right to:
          </p>
          <ul className="list-disc list-inside text-neutral-dark space-y-2">
            <li>Review and verify all submissions</li>
            <li>Reject submissions that are inaccurate, incomplete, or violate OpenStreetMap guidelines</li>
            <li>Remove or modify listings that are found to be incorrect</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prohibited Uses</h2>
          <p className="text-neutral-dark mb-4">
            You agree not to:
          </p>
          <ul className="list-disc list-inside text-neutral-dark space-y-2">
            <li>Submit false or misleading information</li>
            <li>Submit information for businesses you do not own or have permission to represent</li>
            <li>Use automated tools to spam submissions</li>
            <li>Submit duplicate listings</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
          <p className="text-neutral-dark">
            We are not liable for any damages arising from the use of this service or the publication of your information on OpenStreetMap. The service is provided "as is" without warranties of any kind.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
          <p className="text-neutral-dark">
            We reserve the right to modify these Terms of Use at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-neutral-dark">
            If you have questions about these Terms of Use, please contact us at:
          </p>
          <p className="text-neutral-dark mt-2">
            Email: info@bitcoinmerchants.com.au
          </p>
        </section>
      </div>
    </div>
  );
}

