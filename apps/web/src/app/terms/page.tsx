import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using Linkdot creator pages and services.",
};

export default function TermsOfServicePage() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <BrandLogo compact />
        <Link href="/">Back to Linkdot</Link>
      </header>

      <article className="legal-content">
        <p className="landing-eyebrow">LINKDOT POLICIES</p>
        <h1>Terms of Service</h1>
        <p className="legal-meta">Last updated: November 14, 2026</p>

        <p>
          These terms apply when you use Linkdot to create, manage, or visit
          creator pages. By using Linkdot, you agree to follow these terms and
          applicable laws.
        </p>

        <h2>Your account</h2>
        <p>
          Keep your account information accurate and protect your sign-in
          credentials. You are responsible for activity performed through your
          account and for keeping access to your account secure.
        </p>

        <h2>Your content and published pages</h2>
        <p>
          You retain responsibility for the content, links, and media you add.
          You must have the rights and permissions needed to use them. When you
          publish a page, you authorize Linkdot to store and display the
          selected content so the page can be provided to visitors. You can
          update or unpublish your page from your account.
        </p>

        <h2>Subscriber information</h2>
        <p>
          If you collect email addresses through your creator page, you are
          responsible for having an appropriate basis to collect and use them,
          and for complying with applicable privacy and email laws. Linkdot
          stores these addresses for you to view; it does not send newsletter
          messages through the signup form.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Do not use Linkdot to break the law, infringe someone else&apos;s
          rights, distribute harmful or deceptive content, interfere with the
          service, or attempt to access another user&apos;s account or data.
        </p>

        <h2>Third-party services and links</h2>
        <p>
          Creator pages may link to third-party websites or embed third-party
          content. Those services have their own terms and privacy practices.
          Linkdot does not process payments through creator-page links; any
          purchase or payment is handled by the linked provider.
        </p>

        <h2>Service availability</h2>
        <p>
          We work to keep Linkdot available, but features may change and
          interruptions can occur. Linkdot is provided on an as-available basis
          to the extent permitted by law.
        </p>

        <h2>Contact</h2>
        <p className="legal-contact">
          Questions about these terms? Email{" "}
          <a href="mailto:studentio.apps@gmail.com">studentio.apps@gmail.com</a>
          .
        </p>
      </article>
    </main>
  );
}
