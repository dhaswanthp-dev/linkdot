"use client";

import { useState } from "react";
import type { Subscriber } from "@/lib/data/subscribers";

interface AudienceProps {
  subscribers: Subscriber[];
}

export function Audience({ subscribers }: AudienceProps) {
  const [copyMessage, setCopyMessage] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);

  async function copyEmails() {
    setCopyMessage("");
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(
        subscribers.map((subscriber) => subscriber.email).join("\n"),
      );
      setCopyMessage("Subscriber emails copied.");
    } catch {
      setCopyFailed(true);
      setCopyMessage("Could not copy emails. Check clipboard permissions.");
    }
  }

  return (
    <section
      className="dashboard-section audience-section"
      aria-labelledby="audience-heading"
    >
      <div className="dashboard-section-heading">
        <div>
          <h2 id="audience-heading">Your audience</h2>
          <p>{subscribers.length} newsletter signups</p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          type="button"
          onClick={copyEmails}
          disabled={subscribers.length === 0}
        >
          Copy emails
        </button>
      </div>

      {copyMessage && (
        <p
          className={copyFailed ? "dashboard-error" : "dashboard-status"}
          role={copyFailed ? "alert" : "status"}
        >
          {copyMessage}
        </p>
      )}

      {subscribers.length === 0 ? (
        <p className="dashboard-muted">New signups will appear here.</p>
      ) : (
        <ul className="subscriber-list" aria-label="Subscriber email addresses">
          {subscribers.map((subscriber) => (
            <li key={subscriber.id}>{subscriber.email}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
