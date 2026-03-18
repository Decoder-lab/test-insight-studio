import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Cookie } from "lucide-react";
import { clearConsent } from "@/lib/cookieConsent";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const tableHead = "text-left px-3 py-2 font-semibold bg-muted text-foreground";
  const tableCell = "px-3 py-2 text-muted-foreground border-t border-border";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-16 max-w-3xl">

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="font-display text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: March 2026</p>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">1. Data Controller</h2>
            <p>
              Decoder Agency S.L. ("Decoder", "we", "us") is the data controller for your personal
              data. Contact:{" "}
              <a href="mailto:hello@decoder.agency" className="text-accent underline underline-offset-2">
                hello@decoder.agency
              </a>{" "}
              · Barcelona, España.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">2. What Data We Collect</h2>
            <p className="mb-2">We may collect the following data:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Survey responses submitted during the PMF test</li>
              <li>Contact details provided when booking a consultation (via Calendly)</li>
              <li>Usage data collected via analytics cookies (with consent)</li>
            </ul>
            <p className="mt-2">
              We do not collect sensitive personal data or data from minors under 16.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">3. Legal Basis for Processing</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Consent</strong> — Art. 6(1)(a) GDPR — for analytics and marketing cookies</li>
              <li><strong className="text-foreground">Legitimate interests</strong> — Art. 6(1)(f) GDPR — for essential site functionality</li>
              <li><strong className="text-foreground">Contract performance</strong> — Art. 6(1)(b) GDPR — when you book a consultation</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">4. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>To deliver and improve the PMF testing tool</li>
              <li>To respond to consultation requests</li>
              <li>To analyse site usage and improve user experience (analytics, with consent)</li>
              <li>We do not sell or share your data with third parties for marketing purposes</li>
              <li>We do not use automated decision-making or profiling</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">5. Third-Party Processors</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr>
                    <th className={tableHead}>Processor</th>
                    <th className={tableHead}>Purpose</th>
                    <th className={tableHead}>Location</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={tableCell}>Calendly Inc.</td>
                    <td className={tableCell}>Consultation booking</td>
                    <td className={tableCell}>USA (SCC)</td>
                  </tr>
                  <tr>
                    <td className={tableCell}>Google LLC</td>
                    <td className={tableCell}>Analytics (with consent)</td>
                    <td className={tableCell}>USA (SCC)</td>
                  </tr>
                  <tr>
                    <td className={tableCell}>Meta Platforms Inc.</td>
                    <td className={tableCell}>Marketing (with consent)</td>
                    <td className={tableCell}>USA (SCC)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-muted-foreground text-xs">SCC = Standard Contractual Clauses (EU adequacy mechanism)</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">6. Data Retention</h2>
            <p>
              Survey responses are retained for 12 months. Consultation data held by Calendly is
              governed by their own privacy policy. We review and delete data no longer needed.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">7. Your Rights (GDPR)</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Access</strong> — request a copy of your data</li>
              <li><strong className="text-foreground">Rectification</strong> — correct inaccurate data</li>
              <li><strong className="text-foreground">Erasure</strong> — request deletion ("right to be forgotten")</li>
              <li><strong className="text-foreground">Restriction</strong> — limit processing</li>
              <li><strong className="text-foreground">Portability</strong> — receive data in machine-readable format</li>
              <li><strong className="text-foreground">Withdraw consent</strong> — at any time without affecting prior processing</li>
              <li><strong className="text-foreground">Complain</strong> — to the Spanish DPA (AEPD) at{" "}
                <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">aepd.es</a>
              </li>
            </ul>
            <p className="mt-2">
              To exercise any right email{" "}
              <a href="mailto:hello@decoder.agency" className="text-accent underline underline-offset-2">
                hello@decoder.agency
              </a>{" "}
              with subject "GDPR Request".
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">8. Cookies</h2>
            <p className="mb-4">
              We request your consent before placing any non-essential cookies (Art. 5(3) ePrivacy
              Directive + GDPR Art. 6(1)(a)).
            </p>

            <h3 className="font-semibold text-base mb-2">8.1 Necessary cookies</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr>
                    <th className={tableHead}>Cookie</th>
                    <th className={tableHead}>Purpose</th>
                    <th className={tableHead}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${tableCell} font-mono`}>decoder_cookie_consent</td>
                    <td className={tableCell}>Stores your cookie consent preferences</td>
                    <td className={tableCell}>12 months</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-semibold text-base mb-2">
              8.2 Analytics cookies{" "}
              <span className="text-xs font-normal text-muted-foreground">(consent required)</span>
            </h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr>
                    <th className={tableHead}>Cookie</th>
                    <th className={tableHead}>Provider</th>
                    <th className={tableHead}>Purpose</th>
                    <th className={tableHead}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${tableCell} font-mono`}>_ga</td>
                    <td className={tableCell}>Google Analytics</td>
                    <td className={tableCell}>Distinguishes unique users</td>
                    <td className={tableCell}>2 years</td>
                  </tr>
                  <tr>
                    <td className={`${tableCell} font-mono`}>_gid</td>
                    <td className={tableCell}>Google Analytics</td>
                    <td className={tableCell}>Session tracking</td>
                    <td className={tableCell}>24 hours</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-semibold text-base mb-2">
              8.3 Marketing cookies{" "}
              <span className="text-xs font-normal text-muted-foreground">(consent required)</span>
            </h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr>
                    <th className={tableHead}>Cookie</th>
                    <th className={tableHead}>Provider</th>
                    <th className={tableHead}>Purpose</th>
                    <th className={tableHead}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${tableCell} font-mono`}>_fbp</td>
                    <td className={tableCell}>Meta (Facebook)</td>
                    <td className={tableCell}>Ad conversion tracking</td>
                    <td className={tableCell}>3 months</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted border border-border">
              <Cookie className="w-4 h-4 text-accent shrink-0" />
              <p className="text-xs text-muted-foreground">
                You can change or withdraw cookie consent at any time via the{" "}
                <button
                  onClick={() => { clearConsent(); navigate("/"); }}
                  className="text-accent underline underline-offset-2 hover:text-accent/80"
                >
                  Cookie Settings
                </button>{" "}
                link in the footer.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be communicated
              via email if we hold your contact details. The latest version is always at this URL.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">10. Contact</h2>
            <p>
              Questions?{" "}
              <a href="mailto:hello@decoder.agency" className="text-accent underline underline-offset-2">
                hello@decoder.agency
              </a>
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-border text-xs text-muted-foreground">
          © {new Date().getFullYear()} Decoder Agency S.L. All rights reserved.
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
