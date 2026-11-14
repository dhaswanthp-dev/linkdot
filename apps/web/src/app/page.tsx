import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";

export default function Home() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <BrandLogo />
        <nav className="site-navigation" aria-label="Main navigation">
          <a href="#features">Why Linkdot</a>
          <a href="#templates">Templates</a>
          <Link className="site-login-link" href="/login">
            Sign in
          </Link>
          <Link className="site-nav-cta" href="/signup">
            Get started
          </Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">YOUR CORNER OF THE INTERNET</p>
          <h1>One Link. Endless Possibilities.</h1>
          <p className="landing-description">
            Create your personal space, share everything you love, and grow your
            audience with Linkdot.
          </p>
          <div className="landing-actions">
            <Link className="landing-primary-button" href="/signup">
              Get Started Free
            </Link>
            <a className="landing-secondary-button" href="#templates">
              Explore Templates
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="landing-note">
            A personal home for your work, stories, and next big idea.
          </p>
        </div>

        <div className="landing-art" aria-label="Linkdot creator page preview">
          <div className="landing-float-card landing-analytics-card">
            <span className="landing-sample-label">SAMPLE PREVIEW DATA</span>
            <span className="landing-float-title">Profile visits</span>
            <strong>1,284</strong>
            <span className="landing-analytics-sparkline" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <small>Illustrative only · no real creator data</small>
          </div>
          <div className="landing-float-card landing-click-card">
            <span className="landing-click-dot" aria-hidden="true" />
            <span>
              <strong>47 link clicks</strong>
              <small>Sample engagement card</small>
            </span>
            <span className="landing-click-arrow" aria-hidden="true">
              ↗
            </span>
          </div>
          <div
            className="landing-phone"
            aria-label="Sample mobile creator page"
          >
            <div className="landing-phone-notch" aria-hidden="true" />
            <div className="landing-phone-content">
              <span className="landing-phone-status">
                9:41 <span>● ● ●</span>
              </span>
              <div className="landing-phone-avatar">AR</div>
              <span className="landing-phone-creator">Ari Rivera</span>
              <span className="landing-phone-handle">@aririvera</span>
              <p>Design, good stories, and little things worth sharing.</p>
              <div className="landing-phone-socials" aria-hidden="true">
                <span>ig</span>
                <span>tt</span>
                <span>yt</span>
                <span>↗</span>
              </div>
              <div className="landing-phone-link landing-phone-link-featured">
                <span>✦</span>
                <span>Explore my latest work</span>
                <span>↗</span>
              </div>
              <div className="landing-phone-link">
                <span>▣</span>
                <span>Watch a short film</span>
                <span>↗</span>
              </div>
              <div className="landing-phone-link">
                <span>◌</span>
                <span>Studio notes &amp; updates</span>
                <span>↗</span>
              </div>
              <div className="landing-phone-feature">
                <span className="landing-phone-feature-art" aria-hidden="true">
                  01
                </span>
                <span>
                  <small>FEATURED PROJECT</small>
                  <strong>Made for the in-between</strong>
                </span>
              </div>
              <span className="landing-phone-footer">
                A sample Linkdot page
              </span>
            </div>
          </div>
          <span
            className="landing-orbit landing-orbit-one"
            aria-hidden="true"
          />
          <span
            className="landing-orbit landing-orbit-two"
            aria-hidden="true"
          />
          <span
            className="landing-spark landing-spark-one"
            aria-hidden="true"
          />
          <span
            className="landing-spark landing-spark-two"
            aria-hidden="true"
          />
        </div>
      </section>

      <section className="landing-features" id="features">
        <p className="landing-eyebrow">A CREATOR SPACE THAT GROWS WITH YOU</p>
        <h2>More than a list of links.</h2>
        <p>
          Bring your work, videos, offers, and community together in a home that
          feels like yours.
        </p>
        <div className="landing-feature-grid">
          <article>
            <span aria-hidden="true">↗</span>
            <h3>Your story, in one place</h3>
            <p>Links, media, and the details that make your page yours.</p>
          </article>
          <article>
            <span aria-hidden="true">✳</span>
            <h3>Design that feels like you</h3>
            <p>Choose an original template and tune the colors and buttons.</p>
          </article>
          <article>
            <span aria-hidden="true">⌁</span>
            <h3>Know what connects</h3>
            <p>
              See first-party visits and link clicks as your audience grows.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-templates" id="templates">
        <div>
          <p className="landing-eyebrow">SEVEN ORIGINAL STARTING POINTS</p>
          <h2>A page that feels like your world.</h2>
          <p>Every look is customizable, from accent color to button shape.</p>
        </div>
        <div className="landing-template-strip">
          {[
            ["Modern Blue", "#3265ee"],
            ["Premium Red", "#c33c43"],
            ["Minimal Mono", "#171717"],
            ["Neon Lime", "#a9cf38"],
            ["Dark Fitness", "#203328"],
            ["Portfolio", "#7357d6"],
            ["Lifestyle", "#c9775e"],
          ].map(([label, color]) => (
            <div className="landing-template-chip" key={label}>
              <span style={{ backgroundColor: color }} aria-hidden="true" />
              {label}
            </div>
          ))}
        </div>
        <Link className="landing-primary-button" href="/signup">
          Explore Templates <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <footer className="landing-footer">
        <BrandLogo compact />
        <span>Make one link feel like the whole story.</span>
        <nav className="landing-footer-links" aria-label="Legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <Link href="/signup">Get started free</Link>
      </footer>
    </main>
  );
}
