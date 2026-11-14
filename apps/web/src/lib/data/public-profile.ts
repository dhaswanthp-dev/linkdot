import { createClient } from "@/lib/supabase/server";
import {
  creatorCustomizationSchema,
  type CreatorCustomization,
} from "@/shared/schemas";
import type { CreatorBlockType, Database } from "@/lib/database.extended.types";

type PublicProfileRow = Database["public"]["Views"]["public_profiles"]["Row"];
type PublicLinkRow = Database["public"]["Views"]["public_links"]["Row"];
type PublicBlockRow =
  Database["public"]["Views"]["public_creator_blocks"]["Row"];

export interface PublicCreatorProfile extends Omit<
  PublicProfileRow,
  | "accent_color"
  | "button_style"
  | "display_name"
  | "id"
  | "published_design"
  | "social_links"
  | "template_key"
  | "username"
> {
  accent_color: string;
  button_style: "rounded" | "pill" | "square";
  display_name: string;
  id: string;
  design_settings: CreatorCustomization;
  social_links: PublicProfileRow["social_links"];
  template_key: NonNullable<PublicProfileRow["template_key"]>;
  username: string;
}

export interface PublicCreatorBlock {
  block_type: CreatorBlockType;
  description: string | null;
  href: string | null;
  id: string;
  media_urls: string[];
  position: number;
  profile_id: string;
  title: string;
  username: string;
}

export interface PublicCreatorData {
  profile: PublicCreatorProfile;
  links: {
    id: string;
    position: number;
    title: string;
    url: string;
    thumbnail_url: string | null;
  }[];
  blocks: PublicCreatorBlock[];
}

export async function getPublicCreatorData(
  username: string,
): Promise<PublicCreatorData | null> {
  const client = await createClient();
  const { data: row, error: profileError } = await client
    .from("public_profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (profileError) throw profileError;
  if (
    !row?.id ||
    !row.username ||
    !row.display_name ||
    !row.template_key ||
    !row.accent_color ||
    !row.button_style ||
    !row.published_design
  ) {
    return null;
  }
  const parsedDesign = creatorCustomizationSchema.safeParse(
    row.published_design,
  );
  if (!parsedDesign.success) {
    throw new Error("This public profile has invalid published design data.");
  }

  const [linkResult, blockResult] = await Promise.all([
    client
      .from("public_links")
      .select("id, title, url, position, thumbnail_url")
      .eq("username", username)
      .order("position", { ascending: true }),
    client
      .from("public_creator_blocks")
      .select(
        "id, profile_id, username, block_type, title, description, href, media_urls, position",
      )
      .eq("username", username)
      .order("position", { ascending: true }),
  ]);

  if (linkResult.error) throw linkResult.error;
  if (blockResult.error) throw blockResult.error;

  const profile: PublicCreatorProfile = {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio,
    avatar_url: row.avatar_url,
    theme: row.theme,
    template_key: row.template_key,
    accent_color: row.accent_color,
    button_style: row.button_style,
    social_links: row.social_links,
    design_settings: parsedDesign.data,
  };
  const links = linkResult.data
    .filter(
      (
        link,
      ): link is PublicLinkRow & {
        id: string;
        title: string;
        url: string;
        thumbnail_url: string | null;
        position: number;
      } => Boolean(link.id && link.title && link.url && link.position !== null),
    )
    .map(({ id, title, url, position, thumbnail_url }) => ({
      id,
      title,
      url,
      position,
      thumbnail_url,
    }));
  const blocks = blockResult.data
    .filter(
      (
        block,
      ): block is PublicBlockRow & {
        id: string;
        profile_id: string;
        username: string;
        block_type: CreatorBlockType;
        title: string;
        position: number;
      } =>
        Boolean(
          block.id &&
          block.profile_id &&
          block.username &&
          block.block_type &&
          block.title &&
          block.position !== null,
        ),
    )
    .map((block) => ({
      block_type: block.block_type,
      description: block.description,
      href: block.href,
      id: block.id,
      media_urls: block.media_urls ?? [],
      position: block.position,
      profile_id: block.profile_id,
      title: block.title,
      username: block.username,
    }));

  return { profile, links, blocks };
}
