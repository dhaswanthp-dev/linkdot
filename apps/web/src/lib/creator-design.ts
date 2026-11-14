import type { CSSProperties } from "react";
import type { CreatorCustomization } from "@/shared/schemas";

const fontFamilies: Record<
  CreatorCustomization["typography"]["fontFamily"],
  string
> = {
  outfit: "var(--font-outfit), Outfit, sans-serif",
  urbanist: "var(--font-urbanist), Urbanist, sans-serif",
  georgia: "Georgia, serif",
  system: "system-ui, sans-serif",
  mono: "ui-monospace, SFMono-Regular, monospace",
};

const fontSizes: Record<
  CreatorCustomization["typography"]["fontSize"],
  string
> = {
  small: "0.9rem",
  medium: "1rem",
  large: "1.12rem",
};

const buttonHeights: Record<CreatorCustomization["buttons"]["size"], string> = {
  small: "3.2rem",
  medium: "3.8rem",
  large: "4.5rem",
};

const shadows: Record<CreatorCustomization["buttons"]["shadow"], string> = {
  none: "none",
  soft: "0 0.5rem 1.5rem rgb(35 36 50 / 8%)",
  strong: "0 0.85rem 2rem rgb(25 25 35 / 20%)",
};

function safeHttpsUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export function creatorDesignStyle(
  settings: CreatorCustomization,
): CSSProperties {
  const imageUrl = safeHttpsUrl(settings.background.imageUrl);
  const backgroundImage =
    settings.background.type === "gradient"
      ? `linear-gradient(135deg, ${settings.background.gradientStart}, ${settings.background.gradientEnd})`
      : settings.background.type === "image" && imageUrl
        ? `linear-gradient(rgb(15 18 24 / 14%), rgb(15 18 24 / 14%)), url(${JSON.stringify(imageUrl)})`
        : undefined;
  const radius =
    settings.buttons.shape === "pill"
      ? "999px"
      : settings.buttons.shape === "square"
        ? `${settings.buttons.borderRadius}px`
        : `${settings.buttons.borderRadius}px`;

  return {
    backgroundColor: settings.background.color,
    backgroundImage,
    backgroundPosition: `${settings.background.positionX}% ${settings.background.positionY}%`,
    backgroundSize: "cover",
    color: settings.typography.textColor,
    fontFamily: fontFamilies[settings.typography.fontFamily],
    fontSize: fontSizes[settings.typography.fontSize],
    fontWeight: settings.typography.fontWeight,
    textAlign: settings.typography.alignment,
    "--creator-accent": settings.accentColor,
    "--creator-ink": settings.typography.textColor,
    "--creator-button-radius": radius,
    "--creator-button-bg": settings.buttons.color,
    "--creator-button-text": settings.buttons.textColor,
    "--creator-button-shadow": shadows[settings.buttons.shadow],
    "--creator-button-height": buttonHeights[settings.buttons.size],
    "--creator-button-hover": settings.buttons.hoverAnimation,
    "--creator-link-animation": settings.animation,
    "--creator-text-align": settings.typography.alignment,
    "--creator-font-size": fontSizes[settings.typography.fontSize],
    "--creator-font-weight": settings.typography.fontWeight,
    "--creator-content-justify":
      settings.typography.alignment === "left"
        ? "flex-start"
        : settings.typography.alignment === "right"
          ? "flex-end"
          : "center",
    "--creator-button-opacity": settings.theme === "glass" ? "72%" : "100%",
    "--creator-button-blur": settings.theme === "glass" ? "14px" : "0px",
  } as CSSProperties;
}
