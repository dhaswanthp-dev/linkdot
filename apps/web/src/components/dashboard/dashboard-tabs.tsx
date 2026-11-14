"use client";

import { useEffect, useState } from "react";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { Appearance } from "@/components/dashboard/appearance";
import { Audience } from "@/components/dashboard/audience";
import { LinksEditor } from "@/components/dashboard/links-editor";
import { MediaManager } from "@/components/dashboard/media-manager";
import { OverviewPanel } from "@/components/dashboard/overview-panel";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ProfilePreview } from "@/components/dashboard/profile-preview";
import { SettingsPanel } from "@/components/dashboard/settings-panel";
import type { ProfileAnalytics } from "@/lib/data/analytics";
import type { CreatorBlock } from "@/lib/data/creator-content";
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

interface DashboardTabsProps {
  profile: Profile;
  links: Link[];
  blocks: CreatorBlock[];
  analytics: ProfileAnalytics;
  subscribers: Subscriber[];
  onProfileChange: (profile: Profile) => void;
  onLinksChange: (links: Link[]) => void;
  onBlocksChange: (blocks: CreatorBlock[]) => void;
}

const sections: { id: StudioSection; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "profile", label: "My profile", icon: "◉" },
  { id: "design", label: "Design & themes", icon: "✳" },
  { id: "links", label: "Links", icon: "↗" },
  { id: "media", label: "Media & offers", icon: "▧" },
  { id: "analytics", label: "Analytics", icon: "⌁" },
  { id: "audience", label: "Audience", icon: "◎" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

const legacySections: Record<string, StudioSection> = {
  links: "links",
  appearance: "design",
  connections: "settings",
  profile: "profile",
};

function isStudioSection(value: string | null): value is StudioSection {
  return sections.some((section) => section.id === value);
}

function sectionFromUrl(): StudioSection {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("section");
  if (isStudioSection(requested)) return requested;
  const legacy = params.get("tab");
  return legacy ? (legacySections[legacy] ?? "overview") : "overview";
}

export function DashboardTabs({
  profile,
  links,
  blocks,
  analytics,
  subscribers,
  onProfileChange,
  onLinksChange,
  onBlocksChange,
}: DashboardTabsProps) {
  const [activeSection, setActiveSection] = useState<StudioSection>("overview");
  const [draftProfile, setDraftProfile] = useState(profile);

  useEffect(() => {
    const syncFromUrl = () => setActiveSection(sectionFromUrl());
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  function updateDraftProfile(changes: Partial<Profile>) {
    setDraftProfile((current) => ({ ...current, ...changes }));
  }

  function saveProfile(nextProfile: Profile) {
    onProfileChange(nextProfile);
    setDraftProfile(nextProfile);
  }

  function selectSection(section: StudioSection) {
    const params = new URLSearchParams(window.location.search);
    params.delete("tab");
    params.set("section", section);
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}${window.location.hash}`,
    );
    setActiveSection(section);
  }

  const activeSectionLabel =
    sections.find((section) => section.id === activeSection)?.label ??
    "Overview";

  return (
    <div className="studio-workspace">
      <nav className="studio-sidebar" aria-label="Creator dashboard">
        <p className="studio-sidebar-label">WORKSPACE</p>
        {sections.map((section) => (
          <button
            className={`studio-nav-item ${activeSection === section.id ? "is-active" : ""}`}
            type="button"
            key={section.id}
            id={`studio-nav-${section.id}`}
            aria-current={activeSection === section.id ? "page" : undefined}
            onClick={() => selectSection(section.id)}
          >
            <span className="studio-nav-icon" aria-hidden="true">
              {section.icon}
            </span>
            <span>{section.label}</span>
            {section.id === "audience" && subscribers.length > 0 && (
              <span className="studio-nav-count">{subscribers.length}</span>
            )}
          </button>
        ))}
        <div className="studio-sidebar-tip">
          <span aria-hidden="true">✦</span>
          <strong>Made for your next chapter</strong>
          <p>One place to bring every part of your creator world together.</p>
        </div>
      </nav>

      <section
        className="studio-main-panel"
        aria-label={activeSectionLabel}
        aria-labelledby={`studio-nav-${activeSection}`}
      >
        <div className="studio-main-heading">
          <div>
            <p className="studio-eyebrow">YOUR LINKDOT STUDIO</p>
            <h2>{activeSectionLabel}</h2>
          </div>
          <a
            className="studio-view-page"
            href={`/${encodeURIComponent(draftProfile.username)}`}
            target="_blank"
            rel="noreferrer"
          >
            View page <span aria-hidden="true">↗</span>
          </a>
        </div>

        {activeSection === "overview" && (
          <OverviewPanel
            analytics={analytics}
            links={links}
            profile={profile}
            subscribers={subscribers}
            onSelectSection={selectSection}
          />
        )}
        {activeSection === "profile" && (
          <ProfileForm
            profile={profile}
            onSaved={saveProfile}
            onDraftChange={updateDraftProfile}
          />
        )}
        {activeSection === "design" && (
          <Appearance
            profile={draftProfile}
            onSaved={saveProfile}
            onDraftChange={updateDraftProfile}
          />
        )}
        {activeSection === "links" && (
          <LinksEditor initialLinks={links} onLinksChange={onLinksChange} />
        )}
        {activeSection === "media" && (
          <MediaManager
            initialBlocks={blocks}
            onBlocksChange={onBlocksChange}
          />
        )}
        {activeSection === "analytics" && (
          <AnalyticsPanel initialAnalytics={analytics} />
        )}
        {activeSection === "audience" && <Audience subscribers={subscribers} />}
        {activeSection === "settings" && <SettingsPanel profile={profile} />}
      </section>

      <ProfilePreview profile={draftProfile} links={links} blocks={blocks} />
    </div>
  );
}
