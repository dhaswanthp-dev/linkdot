import { describe, expect, it } from "vitest";
import {
  bioSchema,
  buttonStyleSchema,
  creatorBlockSchema,
  creatorCustomizationSchema,
  creatorTemplateSchema,
  defaultCreatorCustomization,
  displayNameSchema,
  linkTitleSchema,
  linkUrlSchema,
  profileAnalyticsSchema,
  subscriberEmailSchema,
  socialLinksSchema,
  themeSchema,
  usernameSchema,
} from "./schemas";

describe("shared validation schemas", () => {
  it("accepts valid usernames and rejects invalid or reserved usernames", () => {
    expect(usernameSchema.safeParse("studio_01").success).toBe(true);
    expect(usernameSchema.safeParse("Admin").success).toBe(false);
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("a".repeat(31)).success).toBe(false);
  });

  it("accepts display names from 1 to 60 characters", () => {
    expect(displayNameSchema.safeParse("Mira").success).toBe(true);
    expect(displayNameSchema.safeParse("").success).toBe(false);
    expect(displayNameSchema.safeParse("a".repeat(61)).success).toBe(false);
  });

  it("allows nullable bios up to 80 characters", () => {
    expect(bioSchema.safeParse(null).success).toBe(true);
    expect(bioSchema.safeParse("a".repeat(80)).success).toBe(true);
    expect(bioSchema.safeParse("a".repeat(81)).success).toBe(false);
  });

  it("accepts link titles from 1 to 100 characters", () => {
    expect(linkTitleSchema.safeParse("Portfolio").success).toBe(true);
    expect(linkTitleSchema.safeParse("").success).toBe(false);
    expect(linkTitleSchema.safeParse("a".repeat(101)).success).toBe(false);
  });

  it("allows only the supported link URL schemes", () => {
    expect(linkUrlSchema.safeParse("https://example.com").success).toBe(true);
    expect(linkUrlSchema.safeParse("http://example.com").success).toBe(true);
    expect(linkUrlSchema.safeParse("mailto:hello@example.com").success).toBe(
      true,
    );
    expect(linkUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });

  it("accepts only the supported profile themes", () => {
    expect(themeSchema.safeParse("light").success).toBe(true);
    expect(themeSchema.safeParse("blush").success).toBe(false);
  });

  it("accepts only the available creator templates and button styles", () => {
    expect(creatorTemplateSchema.safeParse("modern-blue").success).toBe(true);
    expect(creatorTemplateSchema.safeParse("lifestyle").success).toBe(true);
    expect(creatorTemplateSchema.safeParse("unknown").success).toBe(false);
    expect(buttonStyleSchema.safeParse("pill").success).toBe(true);
    expect(buttonStyleSchema.safeParse("diamond").success).toBe(false);
  });

  it("validates saved creator design settings and HTTPS-only media", () => {
    expect(
      creatorCustomizationSchema.safeParse(defaultCreatorCustomization).success,
    ).toBe(true);
    expect(
      creatorCustomizationSchema.safeParse({
        ...defaultCreatorCustomization,
        background: {
          ...defaultCreatorCustomization.background,
          type: "video",
          videoUrl: "javascript:alert(1)",
        },
      }).success,
    ).toBe(false);
    expect(
      creatorCustomizationSchema.safeParse({
        ...defaultCreatorCustomization,
        buttons: { ...defaultCreatorCustomization.buttons, borderRadius: 41 },
      }).success,
    ).toBe(false);
  });

  it("validates public social URLs and monetization links", () => {
    expect(
      socialLinksSchema.safeParse({
        instagram: "https://instagram.com/creator",
      }).success,
    ).toBe(true);
    expect(
      socialLinksSchema.safeParse({ youtube: "javascript:alert(1)" }).success,
    ).toBe(false);
    expect(
      creatorBlockSchema.safeParse({
        block_type: "product",
        title: "My guide",
        description: null,
        href: "https://checkout.example/guide",
        media_urls: [],
        is_visible: true,
      }).success,
    ).toBe(true);
    expect(
      creatorBlockSchema.safeParse({
        block_type: "product",
        title: "My guide",
        description: null,
        href: null,
        media_urls: [],
        is_visible: true,
      }).success,
    ).toBe(false);
  });

  it("validates analytics responses without accepting negative counts", () => {
    const emptyAnalytics = {
      visits: 0,
      unique_visitors: 0,
      clicks: 0,
      daily: [],
      sources: [],
      popular_links: [],
    };
    expect(profileAnalyticsSchema.safeParse(emptyAnalytics).success).toBe(true);
    expect(
      profileAnalyticsSchema.safeParse({
        ...emptyAnalytics,
        visits: -1,
      }).success,
    ).toBe(false);
  });

  it("accepts valid subscriber email addresses up to 254 characters", () => {
    expect(subscriberEmailSchema.safeParse("reader@example.com").success).toBe(
      true,
    );
    expect(subscriberEmailSchema.safeParse("not-an-email").success).toBe(false);
    expect(
      subscriberEmailSchema.safeParse(`${"a".repeat(250)}@x.co`).success,
    ).toBe(false);
  });
});
