"use client";

import { useState } from "react";
import { Connections } from "@/components/dashboard/connections";
import type { Profile } from "@/lib/data/profile";

interface SettingsPanelProps {
  profile: Profile;
}

export function SettingsPanel({ profile }: SettingsPanelProps) {
  const [message, setMessage] = useState("");
  const publicUrl =
    typeof window === "undefined"
      ? `https://linkdot.co/${profile.username}`
      : `${window.location.origin}/${profile.username}`;

  async function copyPublicUrl() {
    setMessage("");
    try {
      await navigator.clipboard.writeText(publicUrl);
      setMessage("Public page URL copied.");
    } catch {
      setMessage("Could not copy the URL. Select it to copy manually.");
    }
  }

  return (
    <section className="dashboard-section" aria-labelledby="settings-heading">
      <div className="dashboard-section-heading">
        <div>
          <h2 id="settings-heading">Settings</h2>
          <p>Manage your public URL and connected accounts.</p>
        </div>
      </div>
      <div className="settings-public-url">
        <div>
          <span>Public creator page</span>
          <strong>{publicUrl}</strong>
        </div>
        <button
          className="btn btn-outline btn-sm"
          type="button"
          onClick={() => void copyPublicUrl()}
        >
          Copy link
        </button>
      </div>
      {message && (
        <p className="dashboard-status" role="status">
          {message}
        </p>
      )}
      <div className="monetization-note settings-note">
        <strong>Payments stay with your provider</strong>
        <p>
          Linkdot prepares offer buttons that point to an external checkout. No
          payment is collected or marked as successful inside Linkdot.
        </p>
      </div>
      <Connections />
    </section>
  );
}
