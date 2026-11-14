"use client";

import type { ProfileAnalytics } from "@/lib/data/analytics";
import type { Link } from "@/lib/data/links";
import type { Profile } from "@/lib/data/profile";
import type { Subscriber } from "@/lib/data/subscribers";

type StudioSection =
  | "overview"
  | "profile"
  | "design"
  | "links"
  | "media"
  | "analytics"
  | "audience"
  | "settings";

interface OverviewPanelProps {
  analytics: ProfileAnalytics;
  links: Link[];
  profile: Profile;
  subscribers: Subscriber[];
  onSelectSection: (section: StudioSection) => void;
}

export function OverviewPanel({
  analytics,
  links,
  profile,
  subscribers,
  onSelectSection,
}: OverviewPanelProps) {
  const publicLinks = links.filter((link) => link.is_visible).length;

  return (
    <section className="dashboard-section overview-section">
      <div className="studio-welcome">
        <div>
          <p className="studio-eyebrow">YOUR CREATOR SPACE</p>
          <h2>Good things start with one link.</h2>
          <p>
            Your page is ready to grow. Add a new story, share an offer, or
            polish the details.
          </p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => onSelectSection("profile")}
        >
          Edit my page
        </button>
      </div>

      <div className="overview-metrics">
        <article>
          <span>Profile visits · 30 days</span>
          <strong>{analytics.visits.toLocaleString()}</strong>
        </article>
        <article>
          <span>Unique sessions</span>
          <strong>{analytics.unique_visitors.toLocaleString()}</strong>
        </article>
        <article>
          <span>Link clicks</span>
          <strong>{analytics.clicks.toLocaleString()}</strong>
        </article>
        <article>
          <span>Audience signups</span>
          <strong>{subscribers.length.toLocaleString()}</strong>
        </article>
      </div>

      <div className="overview-bottom">
        <section className="overview-share-card">
          <div>
            <span className="overview-card-icon" aria-hidden="true">
              ↗
            </span>
            <h3>Your public page</h3>
            <p>Share your Linkdot page wherever your audience finds you.</p>
          </div>
          <a
            href={`/${encodeURIComponent(profile.username)}`}
            target="_blank"
            rel="noreferrer"
          >
            linkdot.co/{profile.username}
          </a>
        </section>
        <section className="overview-checklist">
          <h3>Keep building</h3>
          <button type="button" onClick={() => onSelectSection("links")}>
            <span>{publicLinks ? "✓" : "1"}</span>
            <span>
              <strong>Add your first link</strong>
              <small>{publicLinks} visible links</small>
            </span>
            <span aria-hidden="true">→</span>
          </button>
          <button type="button" onClick={() => onSelectSection("design")}>
            <span>2</span>
            <span>
              <strong>Choose your look</strong>
              <small>Seven creator templates</small>
            </span>
            <span aria-hidden="true">→</span>
          </button>
          <button type="button" onClick={() => onSelectSection("analytics")}>
            <span>3</span>
            <span>
              <strong>Follow your growth</strong>
              <small>
                {analytics.visits
                  ? `${analytics.visits} real visits this month`
                  : "Waiting for your first visits"}
              </small>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        </section>
      </div>
    </section>
  );
}
