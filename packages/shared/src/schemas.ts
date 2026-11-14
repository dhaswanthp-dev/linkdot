import { z } from "zod";

const reservedUsernames = new Set([
  "admin",
  "login",
  "signup",
  "api",
  "www",
  "support",
  "settings",
]);

export const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9_]+$/)
  .refine((username) => !reservedUsernames.has(username), {
    message: "This username is reserved.",
  });

export const displayNameSchema = z.string().min(1).max(60);

export const bioSchema = z.string().max(80).nullable();

export const linkTitleSchema = z.string().min(1).max(100);

export const linkUrlSchema = z.string().regex(/^(https?:\/\/|mailto:)/i, {
  message: "URL must begin with http://, https://, or mailto:.",
});

export const themeSchema = z.enum(["light", "dark", "pastel", "forest"]);

export const creatorTemplateSchema = z.enum([
  "modern-blue",
  "premium-red",
  "minimal-mono",
  "neon-lime",
  "dark-fitness",
  "personal-portfolio",
  "lifestyle",
]);

export const creatorDesignThemeSchema = z.enum([
  "minimal",
  "professional",
  "creator",
  "neon",
  "glass",
  "dark",
  "gradient",
  "pastel",
  "business",
  "music",
  "gaming",
  "elegant",
]);

export type CreatorDesignTheme = z.infer<typeof creatorDesignThemeSchema>;

function isSecureAssetUrl(value: string): boolean {
  if (!value) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export const creatorAnimationSchema = z.enum([
  "none",
  "fade",
  "bounce",
  "pulse",
  "shine",
  "float",
  "scale",
  "slide",
]);

const creatorBackgroundSchema = z.object({
  type: z.enum(["solid", "gradient", "image", "video"]),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  gradientStart: z.string().regex(/^#[0-9a-f]{6}$/i),
  gradientEnd: z.string().regex(/^#[0-9a-f]{6}$/i),
  imageUrl: z
    .string()
    .max(2048)
    .refine(isSecureAssetUrl, "Background image must use HTTPS.")
    .default(""),
  videoUrl: z
    .string()
    .max(2048)
    .refine(isSecureAssetUrl, "Background video must use HTTPS.")
    .default(""),
  positionX: z.number().int().min(0).max(100),
  positionY: z.number().int().min(0).max(100),
});

const creatorTypographySchema = z.object({
  fontFamily: z.enum(["outfit", "urbanist", "georgia", "system", "mono"]),
  fontSize: z.enum(["small", "medium", "large"]),
  fontWeight: z.enum(["400", "500", "600", "700", "800"]),
  textColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  alignment: z.enum(["left", "center", "right"]),
});

const creatorButtonDesignSchema = z.object({
  shape: z.enum(["rounded", "pill", "square"]),
  borderRadius: z.number().int().min(0).max(40),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  textColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  shadow: z.enum(["none", "soft", "strong"]),
  size: z.enum(["small", "medium", "large"]),
  icon: z.enum(["none", "link", "arrow", "sparkle", "heart"]),
  showThumbnails: z.boolean(),
  thumbnailUrl: z
    .string()
    .max(2048)
    .refine(isSecureAssetUrl, "Thumbnail must use HTTPS.")
    .default(""),
  hoverAnimation: creatorAnimationSchema,
});

export const creatorCustomizationSchema = z.object({
  theme: creatorDesignThemeSchema,
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  background: creatorBackgroundSchema,
  typography: creatorTypographySchema,
  buttons: creatorButtonDesignSchema,
  animation: creatorAnimationSchema,
});

export type CreatorCustomization = z.infer<typeof creatorCustomizationSchema>;

export const defaultCreatorCustomization: CreatorCustomization = {
  theme: "professional",
  accentColor: "#3265ee",
  background: {
    type: "solid",
    color: "#edf2ff",
    gradientStart: "#edf2ff",
    gradientEnd: "#dfe8ff",
    imageUrl: "",
    videoUrl: "",
    positionX: 50,
    positionY: 50,
  },
  typography: {
    fontFamily: "urbanist",
    fontSize: "medium",
    fontWeight: "600",
    textColor: "#172448",
    alignment: "center",
  },
  buttons: {
    shape: "rounded",
    borderRadius: 16,
    color: "#ffffff",
    textColor: "#172448",
    shadow: "soft",
    size: "medium",
    icon: "arrow",
    showThumbnails: true,
    thumbnailUrl: "",
    hoverAnimation: "scale",
  },
  animation: "fade",
};

export const buttonStyleSchema = z.enum(["rounded", "pill", "square"]);

export const accentColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i, {
  message: "Use a six-digit hex color.",
});

export const secureAssetUrlSchema = z
  .string()
  .max(2048)
  .refine(isSecureAssetUrl, { message: "Image must use a secure HTTPS URL." });

export const socialLinksSchema = z
  .object({
    instagram: z.string().max(2048).default(""),
    tiktok: z.string().max(2048).default(""),
    youtube: z.string().max(2048).default(""),
    facebook: z.string().max(2048).default(""),
    website: z.string().max(2048).default(""),
  })
  .superRefine((links, context) => {
    for (const [platform, link] of Object.entries(links)) {
      if (link && !/^https?:\/\//i.test(link)) {
        context.addIssue({
          code: "custom",
          message: "Use a valid http:// or https:// URL.",
          path: [platform],
        });
      }
    }
  });

export type SocialLinks = z.infer<typeof socialLinksSchema>;

export const creatorBlockTypeSchema = z.enum([
  "video",
  "image",
  "gallery",
  "product",
  "service",
  "donation",
  "digital_download",
  "subscription",
  "contact",
  "newsletter",
]);

const publicHttpsUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => {
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Use a valid https:// URL." },
  );

export const creatorBlockSchema = z
  .object({
    block_type: creatorBlockTypeSchema,
    title: z.string().trim().min(1).max(100),
    description: z.string().max(500).nullable(),
    href: z
      .string()
      .max(2048)
      .nullable()
      .refine((value) => {
        if (value === null) return true;
        try {
          return ["https:", "mailto:"].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      }, "Use a valid HTTPS or mailto URL."),
    media_urls: z.array(publicHttpsUrlSchema).max(12),
    is_visible: z.boolean().default(true),
  })
  .superRefine((block, context) => {
    if (
      [
        "product",
        "service",
        "donation",
        "digital_download",
        "subscription",
      ].includes(block.block_type) &&
      (!block.href || !/^https:\/\//i.test(block.href))
    ) {
      context.addIssue({
        code: "custom",
        message: "Add an HTTPS checkout or offer link.",
        path: ["href"],
      });
    }

    if (
      ["image", "gallery"].includes(block.block_type) &&
      block.media_urls.length === 0
    ) {
      context.addIssue({
        code: "custom",
        message: "Add at least one image.",
        path: ["media_urls"],
      });
    }

    if (
      block.block_type === "video" &&
      (!block.href ||
        !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(block.href))
    ) {
      context.addIssue({
        code: "custom",
        message: "Use a YouTube video URL.",
        path: ["href"],
      });
    }
  });

export const profileAnalyticsSchema = z.object({
  visits: z.number().int().nonnegative(),
  unique_visitors: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  daily: z.array(
    z.object({
      date: z.string(),
      visits: z.number().int().nonnegative(),
      clicks: z.number().int().nonnegative(),
    }),
  ),
  sources: z.array(
    z.object({
      source: z.string(),
      visits: z.number().int().nonnegative(),
    }),
  ),
  popular_links: z.array(
    z.object({
      title: z.string(),
      clicks: z.number().int().nonnegative(),
    }),
  ),
});

export const subscriberEmailSchema = z
  .string()
  .max(254)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: "Enter a valid email address.",
  });
