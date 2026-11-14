import type { CreatorTemplateKey } from "@/lib/database.extended.types";
import type {
  CreatorCustomization,
  CreatorDesignTheme,
} from "@/shared/schemas";

export interface DesignTheme {
  id: CreatorDesignTheme;
  name: string;
  description: string;
  background: string;
  text: string;
  accent: string;
  button: string;
  buttonText: string;
}

export const designThemes: DesignTheme[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Soft neutrals and crisp contrast.",
    background: "#f6f5f2",
    text: "#242321",
    accent: "#272727",
    button: "#ffffff",
    buttonText: "#242321",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Clear, confident, and versatile.",
    background: "#edf2ff",
    text: "#172448",
    accent: "#3265ee",
    button: "#ffffff",
    buttonText: "#172448",
  },
  {
    id: "creator",
    name: "Creator",
    description: "Expressive color for a personal brand.",
    background: "#f2edff",
    text: "#2e2345",
    accent: "#7957d5",
    button: "#ffffff",
    buttonText: "#2e2345",
  },
  {
    id: "neon",
    name: "Neon",
    description: "Electric lime against a deep canvas.",
    background: "#12160c",
    text: "#efffc2",
    accent: "#baff32",
    button: "#baff32",
    buttonText: "#15190d",
  },
  {
    id: "glass",
    name: "Glass",
    description: "Airy translucence with a cool gradient.",
    background: "#e5f1f5",
    text: "#1d3842",
    accent: "#3d8793",
    button: "#ffffff",
    buttonText: "#1d3842",
  },
  {
    id: "dark",
    name: "Dark",
    description: "Low-glare surfaces and luminous text.",
    background: "#17191e",
    text: "#f2f3f5",
    accent: "#a9b5d0",
    button: "#292d35",
    buttonText: "#f2f3f5",
  },
  {
    id: "gradient",
    name: "Gradient",
    description: "A vivid blend with editorial type.",
    background: "#eee8ff",
    text: "#2b2043",
    accent: "#7651d1",
    button: "#ffffff",
    buttonText: "#2b2043",
  },
  {
    id: "pastel",
    name: "Pastel",
    description: "Gentle pinks and warm lilac.",
    background: "#fff0f5",
    text: "#462c3a",
    accent: "#db83ad",
    button: "#fffafd",
    buttonText: "#462c3a",
  },
  {
    id: "business",
    name: "Business",
    description: "Dependable blue-gray and clean lines.",
    background: "#f1f4f6",
    text: "#1d2b37",
    accent: "#17618b",
    button: "#ffffff",
    buttonText: "#1d2b37",
  },
  {
    id: "music",
    name: "Music",
    description: "Deep plum with a bright stage accent.",
    background: "#211729",
    text: "#f7effa",
    accent: "#f07891",
    button: "#35253f",
    buttonText: "#f7effa",
  },
  {
    id: "gaming",
    name: "Gaming",
    description: "Pixel-bright violet and midnight.",
    background: "#19172a",
    text: "#f4f1ff",
    accent: "#9b7aff",
    button: "#2b2644",
    buttonText: "#f4f1ff",
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Warm parchment and a refined gold accent.",
    background: "#f5efe5",
    text: "#352b21",
    accent: "#b58a54",
    button: "#fffaf2",
    buttonText: "#352b21",
  },
];

export function getDesignTheme(id: CreatorDesignTheme): DesignTheme {
  return designThemes.find((theme) => theme.id === id) ?? designThemes[1];
}

export function applyDesignTheme(
  current: CreatorCustomization,
  theme: DesignTheme,
): CreatorCustomization {
  return {
    ...current,
    theme: theme.id,
    accentColor: theme.accent,
    buttons: {
      ...current.buttons,
      color: theme.button,
      textColor: theme.buttonText,
      shadow: theme.id === "glass" ? "soft" : current.buttons.shadow,
    },
    background: {
      ...current.background,
      type:
        theme.id === "gradient" || theme.id === "glass" ? "gradient" : "solid",
      color: theme.background,
      gradientStart: theme.id === "gradient" ? "#d8c8ff" : theme.background,
      gradientEnd: theme.id === "gradient" ? "#fff0f5" : "#cfe5ea",
    },
    typography: { ...current.typography, textColor: theme.text },
  };
}

export interface CreatorTemplate {
  id: CreatorTemplateKey;
  name: string;
  description: string;
  accent: string;
  surface: string;
  ink: string;
}

export const creatorTemplates: CreatorTemplate[] = [
  {
    id: "modern-blue",
    name: "Modern Blue Creator",
    description: "Bright, confident, and made for a growing audience.",
    accent: "#3265ee",
    surface: "#edf2ff",
    ink: "#172448",
  },
  {
    id: "premium-red",
    name: "Premium Red Creator",
    description: "Warm editorial contrast for a polished creator brand.",
    accent: "#c33c43",
    surface: "#fff1ef",
    ink: "#391d20",
  },
  {
    id: "minimal-mono",
    name: "Minimal Black & White",
    description: "Quiet typography and a crisp monochrome palette.",
    accent: "#171717",
    surface: "#f4f4f2",
    ink: "#171717",
  },
  {
    id: "neon-lime",
    name: "Neon Lime Creator",
    description: "Fresh energy with an electric lime highlight.",
    accent: "#76a91c",
    surface: "#f2f8df",
    ink: "#22300f",
  },
  {
    id: "dark-fitness",
    name: "Dark Fitness Creator",
    description: "A focused dark canvas for movement and coaching.",
    accent: "#a9d94c",
    surface: "#142018",
    ink: "#f4f7ed",
  },
  {
    id: "personal-portfolio",
    name: "Personal Portfolio",
    description: "A calm, expressive stage for selected work.",
    accent: "#7357d6",
    surface: "#f2efff",
    ink: "#28213e",
  },
  {
    id: "lifestyle",
    name: "Lifestyle Creator",
    description: "Soft warmth for stories, recommendations, and updates.",
    accent: "#c9775e",
    surface: "#fbf0e9",
    ink: "#3b2822",
  },
];

export function getCreatorTemplate(id: CreatorTemplateKey): CreatorTemplate {
  return (
    creatorTemplates.find((template) => template.id === id) ??
    creatorTemplates[0]
  );
}
