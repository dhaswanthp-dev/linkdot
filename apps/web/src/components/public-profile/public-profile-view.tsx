"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { socialLinksSchema, subscriberEmailSchema } from "@/shared/schemas";
import { recordLinkClick, recordProfileVisit } from "@/lib/data/analytics";
import { subscribeToProfile } from "@/lib/data/subscribers";
import { creatorDesignStyle } from "@/lib/creator-design";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type {
  PublicCreatorBlock,
  PublicCreatorData,
} from "@/lib/data/public-profile";

interface PublicProfileViewProps {
  creator: PublicCreatorData;
}

const socialLabels: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  website: "Website",
};

function getSourceDomain(): string | null {
  if (!document.referrer) return null;
  try {
    const referrer = new URL(document.referrer);
    if (referrer.origin === window.location.origin) return null;
    return referrer.hostname.slice(0, 120);
  } catch {
    return null;
  }
}

function getVisitorId(profileId: string): string {
  const key = `linkdot-visitor:${profileId}`;
  let visitorId = sessionStorage.getItem(key);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    sessionStorage.setItem(key, visitorId);
  }
  return visitorId;
}

function youtubeEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    let videoId: string | null = null;
    if (url.hostname === "youtu.be") {
      videoId = url.pathname.slice(1);
    } else if (
      url.hostname === "youtube.com" ||
      url.hostname === "www.youtube.com"
    ) {
      videoId =
        url.searchParams.get("v") ??
        url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] ??
        null;
    }
    return videoId && /^[a-zA-Z0-9_-]{6,20}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

function OfferBlock({ block }: { block: PublicCreatorBlock }) {
  if (block.block_type === "newsletter") return null;
  if (block.block_type === "video") {
    const embedUrl = block.href ? youtubeEmbedUrl(block.href) : null;
    return (
      <article className="public-content-card public-video-card" key={block.id}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={block.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : block.href ? (
          <a
            className="public-content-action"
            href={block.href}
            target="_blank"
            rel="noreferrer"
          >
            Watch video ↗
          </a>
        ) : null}
        <div>
          <h2>{block.title}</h2>
          {block.description && <p>{block.description}</p>}
        </div>
      </article>
    );
  }

  const isGallery =
    block.block_type === "gallery" || block.block_type === "image";
  return (
    <article
      className={`public-content-card ${isGallery ? "public-gallery-card" : "public-offer-card"}`}
      key={block.id}
    >
      {isGallery && block.media_urls.length > 0 && (
        <div className="public-gallery">
          {block.media_urls.map((url, index) => (
            <Image
              key={`${block.id}-${index}`}
              src={url}
              alt={`${block.title}, image ${index + 1}`}
              width={640}
              height={420}
              unoptimized
            />
          ))}
        </div>
      )}
      {!isGallery && block.media_urls[0] && (
        <Image
          className="public-offer-image"
          src={block.media_urls[0]}
          alt=""
          width={640}
          height={420}
          unoptimized
        />
      )}
      <div className="public-content-copy">
        <span className="public-content-type">
          {block.block_type.replaceAll("_", " ")}
        </span>
        <h2>{block.title}</h2>
        {block.description && <p>{block.description}</p>}
        {block.href && (
          <a
            className="public-content-action"
            href={block.href}
            target="_blank"
            rel="noreferrer"
          >
            {block.block_type === "contact"
              ? "Get in touch"
              : [
                    "product",
                    "service",
                    "donation",
                    "digital_download",
                    "subscription",
                  ].includes(block.block_type)
                ? "Continue with provider"
                : "Explore"}
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}

export function PublicProfileView({ creator }: PublicProfileViewProps) {
  const { profile, links, blocks } = creator;
  const prefersReducedMotion = useReducedMotion();
  const design = profile.design_settings;
  const socialResult = socialLinksSchema.safeParse(profile.social_links);
  const socialLinks = socialResult.success
    ? Object.entries(socialResult.data).filter(([, url]) => Boolean(url))
    : [];
  const hasNewsletter = blocks.some(
    (block) => block.block_type === "newsletter",
  );
  const newsletterBlock = blocks.find(
    (block) => block.block_type === "newsletter",
  );
  const [email, setEmail] = useState("");
  const [subscribeMessage, setSubscribeMessage] = useState("");
  const [subscribeError, setSubscribeError] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const trackedProfileIds = useRef(new Set<string>());

  useEffect(() => {
    if (trackedProfileIds.current.has(profile.id)) return;
    trackedProfileIds.current.add(profile.id);
    let visitorId: string;
    try {
      visitorId = getVisitorId(profile.id);
    } catch (error) {
      console.error("Could not create an anonymous analytics session.", error);
      return;
    }
    void recordProfileVisit({
      profileId: profile.id,
      visitorId,
      sourceDomain: getSourceDomain(),
    }).catch((error: unknown) => {
      console.error("Could not record this profile visit.", error);
    });
  }, [profile.id]);

  async function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubscribing) return;
    const parsedEmail = subscriberEmailSchema.safeParse(email.trim());
    if (!parsedEmail.success) {
      setSubscribeError("Enter a valid email address.");
      setSubscribeMessage("");
      return;
    }

    setIsSubscribing(true);
    setSubscribeError("");
    setSubscribeMessage("");
    try {
      await subscribeToProfile(profile.id, parsedEmail.data);
      setEmail("");
      setSubscribeMessage("You're on the list. Thanks for joining.");
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? error.code
          : undefined;
      setSubscribeError(
        code === "23505"
          ? "This email is already subscribed."
          : "We could not subscribe you right now. Please try again.",
      );
    } finally {
      setIsSubscribing(false);
    }
  }

  function openTrackedLink(linkId: string, url: string) {
    if (url.startsWith("mailto:")) {
      window.location.assign(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    void recordLinkClick(linkId, getSourceDomain()).catch((error: unknown) => {
      console.error("Could not record this link click.", error);
    });
  }

  return (
    <main
      className={`public-profile theme-${design.theme} public-animation-${design.animation}`}
      style={
        {
          ...creatorDesignStyle(design),
          "--creator-accent": design.accentColor,
          "--creator-surface": design.background.color,
          "--creator-ink": design.typography.textColor,
          "--creator-font-weight": design.typography.fontWeight,
        } as CSSProperties
      }
    >
      {design.background.type === "video" && design.background.videoUrl && (
        <video
          className="public-profile-background-video"
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
      <div className="public-profile-shell">
        <div className="public-profile-brand">
          <BrandLogo compact />
        </div>
        <header className="public-profile-header">
          {profile.avatar_url ? (
            <Image
              className="public-profile-avatar"
              src={profile.avatar_url}
              alt={`${profile.display_name}'s profile photo`}
              width={112}
              height={112}
              priority
              unoptimized
            />
          ) : (
            <div
              className="public-profile-avatar public-profile-initials"
              aria-hidden="true"
            >
              {profile.display_name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <h1>{profile.display_name}</h1>
          <p className="public-profile-username">@{profile.username}</p>
          {profile.bio && <p className="public-profile-bio">{profile.bio}</p>}
          {socialLinks.length > 0 && (
            <nav className="public-social-links" aria-label="Social profiles">
              {socialLinks.map(([platform, url]) => (
                <a
                  href={url}
                  key={platform}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={socialLabels[platform] ?? platform}
                >
                  {platform.slice(0, 2).toUpperCase()}
                </a>
              ))}
            </nav>
          )}
        </header>

        <section className="public-link-list" aria-label="Creator links">
          {links.map((link, index) => (
            <a
              className={`public-link-button public-link-hover-${design.buttons.hoverAnimation}`}
              href={link.url}
              key={link.id}
              style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
              onClick={(event) => {
                event.preventDefault();
                openTrackedLink(link.id, link.url);
              }}
            >
              {design.buttons.showThumbnails &&
              (link.thumbnail_url || design.buttons.thumbnailUrl) ? (
                <Image
                  className="public-link-thumbnail"
                  src={link.thumbnail_url || design.buttons.thumbnailUrl}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                />
              ) : (
                <span className="public-link-leading-icon" aria-hidden="true">
                  {getLinkIcon(design.buttons.icon)}
                </span>
              )}
              <span className="public-link-title">{link.title}</span>
              <span className="public-link-action-icon" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </section>

        {blocks
          .filter((block) => block.block_type !== "newsletter")
          .map((block) => (
            <OfferBlock block={block} key={block.id} />
          ))}

        {hasNewsletter && (
          <section
            className="public-newsletter"
            aria-labelledby="newsletter-heading"
          >
            <div>
              <span aria-hidden="true">✳</span>
              <h2 id="newsletter-heading">
                {newsletterBlock?.title ?? "Join my newsletter"}
              </h2>
              <p>
                {newsletterBlock?.description ??
                  "Notes, new work, and occasional good things in your inbox."}
              </p>
            </div>
            <form onSubmit={handleSubscribe} noValidate>
              <label className="sr-only" htmlFor="public-newsletter-email">
                Email address
              </label>
              <input
                id="public-newsletter-email"
                type="email"
                autoComplete="email"
                placeholder="Your email address"
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(subscribeError)}
                aria-describedby={
                  subscribeError
                    ? "public-subscribe-error"
                    : subscribeMessage
                      ? "public-subscribe-success"
                      : undefined
                }
              />
              <button type="submit" disabled={isSubscribing}>
                {isSubscribing ? "Joining..." : "Subscribe"}
              </button>
            </form>
            {subscribeError && (
              <p
                className="public-form-error"
                id="public-subscribe-error"
                role="alert"
              >
                {subscribeError}
              </p>
            )}
            {subscribeMessage && (
              <p
                className="public-form-success"
                id="public-subscribe-success"
                role="status"
              >
                {subscribeMessage}
              </p>
            )}
          </section>
        )}

        <footer className="public-profile-footer">
          <span>Made with Linkdot</span>
          <Link href="/">Create your own page</Link>
        </footer>
      </div>
    </main>
  );
}

function getLinkIcon(icon: string): string {
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
