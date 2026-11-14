import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Linkdot handles account, creator, subscriber, and analytics data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <BrandLogo compact />
        <Link href="/">Back to Linkdot</Link>
      </header>

      <article className="legal-content">
        <p className="landing-eyebrow">LINKDOT POLICIES</p>
        <h1>Privacy Policy</h1>
        <p className="legal-meta">Last updated: November 14, 2026</p>

        <p>
          This policy describes information handled by Linkdot when you use the
          website, create a creator page, or visit a published page.
        </p>

        <h2>Information we handle</h2>
        <ul>
          <li>
            Account information, such as your email address and account details
            supplied when you register or sign in with Google.
          </li>
          <li>
            Creator information you provide, including your name, username, bio,
            avatar, social links, design choices, links, and uploaded images or
            videos.
          </li>
          <li>
            Email addresses submitted through a creator&apos;s newsletter form.
            These are stored for that creator to view; the form does not send
            newsletter messages.
          </li>
          <li>
            Page and link analytics, including event times, the referring domain
            when available, and a random browser-session identifier used to
            estimate unique visitors for a creator page.
          </li>
        </ul>

        <h2>What is public</h2>
        <p>
          When a creator publishes a page, its selected profile details, social
          links, visible links, media, and design are available to visitors.
          Subscriber email addresses are not displayed on public pages. Only add
          information and media you intend to share publicly.
        </p>

        <h2>How information is used</h2>
        <p>
          Linkdot uses this information to provide sign-in, creator pages,
          uploads, newsletter signups, and creator analytics. Supabase provides
          authentication, database, and file storage. Google processes Google
          sign-in. Embedded YouTube content may load from YouTube when a visitor
          plays it.
        </p>

        <h2>Storage and choices</h2>
        <p>
          Linkdot uses session storage in your browser to keep a temporary
          visitor identifier for creator-page analytics. Account and creator
          data is retained as needed to provide the service. You can update or
          unpublish creator content from your account. For questions or deletion
          requests, contact us using the address below.
        </p>

        <h2>Contact</h2>
        <p className="legal-contact">
          For privacy questions or requests, email{" "}
          <a href="mailto:studentio.apps@gmail.com">studentio.apps@gmail.com</a>
          .
        </p>
      </article>
    </main>
  );
}
