"use client";

import { useEffect, useState } from "react";
import {
  getOwnProfileAnalytics,
  type ProfileAnalytics,
} from "@/lib/data/analytics";

interface AnalyticsPanelProps {
  initialAnalytics: ProfileAnalytics;
}

const periods = [
  { days: 1, label: "24 hours" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
] as const;

export function AnalyticsPanel({ initialAnalytics }: AnalyticsPanelProps) {
  const [days, setDays] = useState<1 | 7 | 30>(30);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (days === 30) return;

    let active = true;
    void getOwnProfileAnalytics(days)
      .then((result) => {
        if (active) setAnalytics(result);
      })
      .catch(() => {
        if (active) {
          setError("Analytics could not be loaded. Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [days]);

  const maxActivity = Math.max(
    1,
    ...analytics.daily.map((day) => day.visits + day.clicks),
  );
  const clickThroughRate = analytics.visits
    ? (analytics.clicks / analytics.visits) * 100
    : 0;

  return (
    <section className="dashboard-section" aria-labelledby="analytics-heading">
      <div className="dashboard-section-heading">
        <div>
          <h2 id="analytics-heading">Analytics</h2>
          <p>First-party events recorded for your profile.</p>
        </div>
        <div className="analytics-periods" aria-label="Analytics period">
          {periods.map((period) => (
            <button
              className={days === period.days ? "is-active" : ""}
              type="button"
              key={period.days}
              aria-pressed={days === period.days}
              onClick={() => {
                if (period.days === 30) {
                  setAnalytics(initialAnalytics);
                  setError("");
                  setLoading(false);
                } else {
                  setLoading(true);
                  setError("");
                }
                setDays(period.days);
              }}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      )}
      {loading && (
        <p className="dashboard-muted" role="status">
          Updating analytics…
        </p>
      )}

      <div className="analytics-metrics">
        <article>
          <span>Profile visits</span>
          <strong>{analytics.visits.toLocaleString()}</strong>
        </article>
        <article>
          <span>Unique visitors</span>
          <strong>{analytics.unique_visitors.toLocaleString()}</strong>
        </article>
        <article>
          <span>Link clicks</span>
          <strong>{analytics.clicks.toLocaleString()}</strong>
        </article>
        <article>
          <span>Click-through rate</span>
          <strong>{clickThroughRate.toFixed(1)}%</strong>
        </article>
      </div>

      {analytics.visits === 0 && analytics.clicks === 0 ? (
        <div className="analytics-empty">
          <strong>No events in this period yet.</strong>
          <p>
            Views and link clicks will appear here as people visit your public
            page. No sample numbers are shown.
          </p>
        </div>
      ) : (
        <>
          <div
            className="analytics-chart"
            role="img"
            aria-label="Daily profile visits and link clicks"
          >
            {analytics.daily.map((day) => {
              const activity = day.visits + day.clicks;
              const height = Math.max(5, (activity / maxActivity) * 100);
              return (
                <div className="analytics-chart-day" key={day.date}>
                  <div className="analytics-chart-track">
                    <span
                      className="analytics-chart-bar"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <time dateTime={day.date}>
                    {new Date(`${day.date}T12:00:00`).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" },
                    )}
                  </time>
                  <span className="sr-only">
                    {day.visits} visits and {day.clicks} clicks
                  </span>
                </div>
              );
            })}
          </div>
          <div className="analytics-legend">
            <span>Visits and clicks</span>
            <span>Data: Linkdot first-party events</span>
          </div>
        </>
      )}

      <div className="analytics-lists">
        <section>
          <h3>Traffic sources</h3>
          {analytics.sources.length ? (
            <ol>
              {analytics.sources.map((source) => (
                <li key={source.source}>
                  <span>{source.source}</span>
                  <strong>{source.visits}</strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="dashboard-muted">No referral sources recorded yet.</p>
          )}
        </section>
        <section>
          <h3>Popular links</h3>
          {analytics.popular_links.length ? (
            <ol>
              {analytics.popular_links.map((link, index) => (
                <li key={`${link.title}-${index}`}>
                  <span>{link.title}</span>
                  <strong>{link.clicks}</strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="dashboard-muted">No link clicks recorded yet.</p>
          )}
        </section>
      </div>
      <p className="dashboard-muted analytics-privacy-note">
        Unique visitors are anonymous browser sessions. Referrers are stored as
        hostnames only; Linkdot does not store visitor email addresses or IPs.
      </p>
    </section>
  );
}
