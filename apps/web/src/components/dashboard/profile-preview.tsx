import Image from "next/image";
import type { CSSProperties } from "react";
import { socialLinksSchema } from "@/shared/schemas";
import type { CreatorBlock } from "@/lib/data/creator-content";
import type { Link } from "@/lib/data/links";
import type { Profile } from "@/lib/data/profile";
import { creatorCustomizationSchema } from "@/shared/schemas";
import { creatorDesignStyle } from "@/lib/creator-design";
import { getCreatorTemplate } from "@/lib/creator-templates";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface ProfilePreviewProps {
  profile: Profile;
  links: Link[];
  blocks: CreatorBlock[];
}

export function ProfilePreview({
  profile,
  links,
  blocks,
}: ProfilePreviewProps) {
  const prefersReducedMotion = useReducedMotion();
  const design = creatorCustomizationSchema.parse(profile.design_settings);
  const template = getCreatorTemplate(profile.template_key);
  const safeSocialLinks = socialLinksSchema.safeParse(profile.social_links);
  const socialCount = safeSocialLinks.success
    ? Object.values(safeSocialLinks.data).filter(Boolean).length
    : 0;
  const visibleLinks = links.filter((link) => link.is_visible);
  const visibleBlocks = blocks.filter((block) => block.is_visible);

  return (
    <aside className="studio-preview" aria-label="Live page preview">
      <div className="studio-preview-heading">
        <div>
          <span>Live preview</span>
          <strong>What your audience sees</strong>
        </div>
        <span className="preview-live-indicator">LIVE</span>
      </div>
      <div
        className={`preview-device template-${profile.template_key} preview-animation-${design.animation}`}
        style={
          {
            ...creatorDesignStyle(design),
            "--preview-accent": design.accentColor,
            "--preview-surface": design.background.color || template.surface,
            "--preview-ink": design.typography.textColor,
          } as CSSProperties
        }
      >
        <div className="preview-device-camera" aria-hidden="true" />
        <div
          className="preview-device-screen"
          style={creatorDesignStyle(design)}
        >
          {design.background.type === "video" && design.background.videoUrl && (
            <video
              className="preview-background-video"
              src={design.background.videoUrl}
              autoPlay={!prefersReducedMotion}
              muted
              loop
              playsInline
              aria-hidden="true"
              style={{
                objectPosition: `${design.background.positionX}% ${design.background.positionY}%`,
              }}
            />
          )}
          <div className="preview-cover" aria-hidden="true" />
          {profile.avatar_url ? (
            <Image
              className="preview-avatar"
              src={profile.avatar_url}
              alt=""
              width={76}
              height={76}
              unoptimized
            />
          ) : (
            <div
              className="preview-avatar preview-avatar-initials"
              aria-hidden="true"
            >
              {profile.display_name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <h3>{profile.display_name}</h3>
          <p className="preview-username">@{profile.username}</p>
          {profile.bio && <p className="preview-bio">{profile.bio}</p>}

          <div
            className="preview-socials"
            aria-label={`${socialCount} social links`}
          >
            {safeSocialLinks.success &&
              Object.entries(safeSocialLinks.data)
                .filter(([, url]) => Boolean(url))
                .slice(0, 5)
                .map(([name]) => (
                  <span key={name} title={name}>
                    {name.slice(0, 1).toUpperCase()}
                  </span>
                ))}
          </div>

          <div className="preview-link-stack">
            {visibleLinks.slice(0, 4).map((link) => (
              <div
                className={`preview-link preview-hover-${design.buttons.hoverAnimation}`}
                key={link.id}
              >
                {design.buttons.showThumbnails &&
                (link.thumbnail_url || design.buttons.thumbnailUrl) ? (
                  <Image
                    className="preview-link-thumbnail"
                    src={link.thumbnail_url || design.buttons.thumbnailUrl}
                    alt=""
                    width={44}
                    height={44}
                    unoptimized
                  />
                ) : (
                  <span className="preview-link-icon" aria-hidden="true">
                    {previewIcon(design.buttons.icon)}
                  </span>
                )}
                <span>{link.title}</span>
                <span className="preview-link-icon" aria-hidden="true">
                  ↗
                </span>
              </div>
            ))}
            {visibleBlocks.slice(0, 3).map((block) => (
              <div className="preview-link preview-content-link" key={block.id}>
                <span>{block.title}</span>
                <small>{block.block_type.replaceAll("_", " ")}</small>
              </div>
            ))}
            {visibleLinks.length === 0 && visibleBlocks.length === 0 && (
              <div className="preview-empty">
                Your links and content will appear here.
              </div>
            )}
          </div>
          <span className="preview-footer">Made with Linkdot</span>
        </div>
      </div>
      <p className="preview-url">linkdot.co/{profile.username}</p>
    </aside>
  );
}

function previewIcon(icon: string): string {
  switch (icon) {
    case "link":
      return "↗";
    case "sparkle":
      return "✦";
    case "heart":
      return "♥";
    case "none":
      return "";
    default:
      return "↗";
  }
}
