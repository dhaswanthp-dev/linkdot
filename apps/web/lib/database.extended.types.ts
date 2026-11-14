import type { Database as BaseDatabase, Json } from "./database.types";

export type CreatorBlockType =
  | "video"
  | "image"
  | "gallery"
  | "product"
  | "service"
  | "donation"
  | "digital_download"
  | "subscription"
  | "contact"
  | "newsletter";

export type CreatorTemplateKey =
  | "modern-blue"
  | "premium-red"
  | "minimal-mono"
  | "neon-lime"
  | "dark-fitness"
  | "personal-portfolio"
  | "lifestyle";

type BaseTables = BaseDatabase["public"]["Tables"];
type BaseViews = BaseDatabase["public"]["Views"];
type BaseProfileTable = BaseTables["profiles"];

type CreatorProfileFields = {
  accent_color: string;
  button_style: "rounded" | "pill" | "square";
  design_settings: Json;
  is_published: boolean;
  published_design: Json | null;
  social_links: Json;
  template_key: CreatorTemplateKey;
};

type BaseLinkTable = BaseTables["links"];
type CreatorLinkFields = {
  thumbnail_url: string | null;
};

type CreatorBlockRow = {
  block_type: CreatorBlockType;
  created_at: string;
  description: string | null;
  href: string | null;
  id: string;
  is_visible: boolean;
  media_urls: string[];
  position: number;
  profile_id: string;
  title: string;
  updated_at: string;
};

type CreatorVisitRow = {
  id: string;
  profile_id: string;
  source_domain: string | null;
  visited_at: string;
  visitor_id: string;
};

type CreatorDatabase = Omit<BaseDatabase, "public"> & {
  public: Omit<BaseDatabase["public"], "Tables" | "Views" | "Functions"> & {
    Tables: Omit<
      BaseTables,
      "creator_blocks" | "links" | "profile_visits" | "profiles"
    > & {
      creator_blocks: {
        Row: CreatorBlockRow;
        Insert: Omit<CreatorBlockRow, "created_at" | "id" | "updated_at"> & {
          created_at?: string;
          id?: string;
          updated_at?: string;
        };
        Update: Partial<CreatorBlockRow>;
        Relationships: [];
      };
      profile_visits: {
        Row: CreatorVisitRow;
        Insert: Omit<CreatorVisitRow, "id" | "visited_at"> & {
          id?: string;
          visited_at?: string;
        };
        Update: Partial<CreatorVisitRow>;
        Relationships: [];
      };
      profiles: {
        Row: BaseProfileTable["Row"] & CreatorProfileFields;
        Insert: BaseProfileTable["Insert"] & Partial<CreatorProfileFields>;
        Update: BaseProfileTable["Update"] & Partial<CreatorProfileFields>;
        Relationships: BaseProfileTable["Relationships"];
      };
      links: {
        Row: BaseLinkTable["Row"] & CreatorLinkFields;
        Insert: BaseLinkTable["Insert"] & Partial<CreatorLinkFields>;
        Update: BaseLinkTable["Update"] & Partial<CreatorLinkFields>;
        Relationships: BaseLinkTable["Relationships"];
      };
    };
    Views: Omit<BaseViews, "public_profiles"> & {
      public_creator_blocks: {
        Row: {
          block_type: CreatorBlockType | null;
          description: string | null;
          href: string | null;
          id: string | null;
          media_urls: string[] | null;
          position: number | null;
          profile_id: string | null;
          title: string | null;
          username: string | null;
        };
        Relationships: [];
      };
      public_profiles: {
        Row: BaseViews["public_profiles"]["Row"] & {
          accent_color: string | null;
          button_style: "rounded" | "pill" | "square" | null;
          published_design: Json | null;
          social_links: Json | null;
          template_key: CreatorTemplateKey | null;
        };
        Relationships: BaseViews["public_profiles"]["Relationships"];
      };
      public_links: {
        Row: BaseViews["public_links"]["Row"] & {
          thumbnail_url: string | null;
        };
        Relationships: BaseViews["public_links"]["Relationships"];
      };
    };
    Functions: BaseDatabase["public"]["Functions"] & {
      get_own_profile_analytics: {
        Args: { p_since: string };
        Returns: Json;
      };
    };
  };
};

export type { CreatorDatabase as Database };
