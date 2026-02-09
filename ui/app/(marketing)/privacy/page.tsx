import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'ScraperAgent privacy policy — GDPR compliant. Learn how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Privacy Policy</h1>
      <p className="text-sm text-text-muted mb-10">Last updated: February 2026</p>

      <div className="prose-sm space-y-8 text-text-secondary leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Who We Are</h2>
          <p>
            ScraperAgent is operated by Kovimatic, a company registered in Ireland. Our website is
            located at scraperagent.eu. For any privacy-related inquiries, contact us at{' '}
            <a href="mailto:it@kovimatic.ie" className="text-blue-400 hover:text-blue-300 transition-colors">
              it@kovimatic.ie
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">What Data We Collect</h2>
          <p>When you subscribe to ScraperAgent, we collect:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Email address</strong> (required) — to deliver reports</li>
            <li><strong>Name</strong> (optional) — for personalization</li>
            <li><strong>Domain preference</strong> — Market, Crypto, or Both</li>
            <li><strong>Management token</strong> — generated automatically for subscription management</li>
          </ul>
          <p className="mt-2">We do not collect payment card details directly — payments are processed by our payment provider.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Delivering daily market intelligence reports to your email</li>
            <li>Managing your subscription (trial tracking, domain preferences)</li>
            <li>Service communications (trial expiry notices, important updates)</li>
          </ul>
          <p className="mt-2">We <strong>never</strong> sell, rent, or share your personal data with third parties for marketing purposes.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Data Storage</h2>
          <p>
            Your data is stored in a PostgreSQL database hosted on our infrastructure. Data is encrypted
            in transit (TLS) and access is restricted to authorized personnel only.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Third-Party Services</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Scaleway</strong> — SMTP email delivery (processes your email address to send reports)</li>
            <li><strong>Azure OpenAI</strong> — AI analysis engine (no user data is sent to the AI model; only public tweet data is processed)</li>
            <li><strong>Vercel</strong> — Website hosting</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Your Rights (GDPR)</h2>
          <p>Under GDPR, you have the right to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Access</strong> — Request a copy of the data we hold about you</li>
            <li><strong>Rectification</strong> — Update your email, name, or preferences via your management page</li>
            <li><strong>Erasure</strong> — Permanently delete all your data with one click from your management page</li>
            <li><strong>Portability</strong> — Request your data in a machine-readable format</li>
            <li><strong>Object</strong> — Opt out of communications at any time by cancelling your subscription</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Cookies</h2>
          <p>
            ScraperAgent uses only essential cookies: a theme preference cookie (light/dark mode)
            and an admin authentication cookie for the admin dashboard. We do not use tracking cookies,
            analytics, or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Data Retention</h2>
          <p>
            Your data is retained for as long as your subscription is active. When you cancel, your
            data is retained for 30 days (in case you reactivate), then permanently deleted. You can
            request immediate deletion at any time via your management page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Contact</h2>
          <p>
            For any privacy concerns, data requests, or questions, contact us at{' '}
            <a href="mailto:it@kovimatic.ie" className="text-blue-400 hover:text-blue-300 transition-colors">
              it@kovimatic.ie
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
