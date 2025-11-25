export default function PrivacyPage() {
  return (
    <div className="container py-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p className="text-neutral-dark mb-4">
            This Privacy Policy explains how we collect, use, and protect your information when you use the Aussie Bitcoin Merchants portal. We are committed to protecting your privacy and complying with Australian privacy laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p className="text-neutral-dark mb-4">
            We collect the following information:
          </p>
          <ul className="list-disc list-inside text-neutral-dark space-y-2 mb-4">
            <li><strong>Business Information:</strong> Business name, address, category, description, contact details (phone, website, email - all optional except business name)</li>
            <li><strong>Bitcoin Acceptance Details:</strong> Payment methods accepted, location of acceptance (in-store, online)</li>
            <li><strong>Optional Email:</strong> If you provide an email address, we may use it to send you confirmation and updates about your listing</li>
          </ul>
          <p className="text-neutral-dark">
            We do NOT collect personally identifiable information about submitters beyond what is necessary for the business listing.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <ul className="list-disc list-inside text-neutral-dark space-y-2">
            <li>To create and publish your business listing on OpenStreetMap</li>
            <li>To verify submissions and prevent duplicates</li>
            <li>To contact you about your submission (if email provided)</li>
            <li>To improve our service and prevent spam</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Storage and Sharing</h2>
          <p className="text-neutral-dark mb-4">
            Your business information is:
          </p>
          <ul className="list-disc list-inside text-neutral-dark space-y-2">
            <li>Stored in our secure database for audit and moderation purposes</li>
            <li>Published to OpenStreetMap under the Open Database License (ODbL)</li>
            <li>Made publicly available on BTCMap and other services that use OpenStreetMap data</li>
            <li>NOT sold or shared with third parties for marketing purposes</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p className="text-neutral-dark mb-4">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-neutral-dark space-y-2">
            <li>Request access to your submitted information</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your submission (contact us at info@bitcoinmerchants.com.au)</li>
            <li>Opt out of email communications</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Security</h2>
          <p className="text-neutral-dark">
            We use industry-standard security measures to protect your information, including HTTPS encryption, secure database storage, and regular security audits.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-neutral-dark">
            If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
          </p>
          <p className="text-neutral-dark mt-2">
            Email: info@bitcoinmerchants.com.au
          </p>
        </section>

        <section>
          <p className="text-sm text-neutral-dark">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </section>
      </div>
    </div>
  );
}

