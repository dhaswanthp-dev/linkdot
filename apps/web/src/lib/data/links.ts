import {
  linkTitleSchema,
  linkUrlSchema,
  secureAssetUrlSchema,
} from "@/shared/schemas";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.extended.types";
import {
  requireOwnedProfileId,
  requireSignedInUserId,
} from "@/lib/data/ownership";

export type Link = Database["public"]["Tables"]["links"]["Row"];

async function getOwnedLinks(
  client: ReturnType<typeof createClient>,
  profileId: string,
): Promise<Link[]> {
  const { data, error } = await client
    .from("links")
    .select("*")
    .eq("profile_id", profileId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}

export async function listOwnLinks(): Promise<Link[]> {
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const profileId = await requireOwnedProfileId(client, userId);
  return getOwnedLinks(client, profileId);
}

export async function createOwnLink(input: {
  title: string;
  url: string;
}): Promise<Link> {
  const title = linkTitleSchema.parse(input.title);
  const url = linkUrlSchema.parse(input.url);
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const profileId = await requireOwnedProfileId(client, userId);
  const currentLinks = await getOwnedLinks(client, profileId);
  const { data, error } = await client
    .from("links")
    .insert({
      profile_id: profileId,
      title,
      url,
      position:
        currentLinks.length > 0
          ? Math.max(...currentLinks.map((link) => link.position)) + 1
          : 0,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateOwnLink(
  linkId: string,
  changes: Partial<
    Pick<Link, "title" | "url" | "is_visible" | "thumbnail_url">
  >,
): Promise<Link> {
  const updates: Database["public"]["Tables"]["links"]["Update"] = {};
  if (changes.title !== undefined) {
    updates.title = linkTitleSchema.parse(changes.title);
  }
  if (changes.url !== undefined) {
    updates.url = linkUrlSchema.parse(changes.url);
  }
  if (changes.is_visible !== undefined) {
    if (typeof changes.is_visible !== "boolean") {
      throw new Error("Link visibility must be true or false.");
    }
    updates.is_visible = changes.is_visible;
  }
  if (changes.thumbnail_url !== undefined) {
    updates.thumbnail_url =
      changes.thumbnail_url === null
        ? null
        : secureAssetUrlSchema.parse(changes.thumbnail_url);
  }
  if (Object.keys(updates).length === 0) {
    throw new Error("There are no link changes to save.");
  }

  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const profileId = await requireOwnedProfileId(client, userId);
  const { data, error } = await client
    .from("links")
    .update(updates)
    .eq("id", linkId)
    .eq("profile_id", profileId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("That link could not be found in your profile.");
  return data;
}

export async function deleteOwnLink(linkId: string): Promise<void> {
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const profileId = await requireOwnedProfileId(client, userId);
  const { data, error } = await client
    .from("links")
    .delete()
    .eq("id", linkId)
    .eq("profile_id", profileId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("That link could not be found in your profile.");
}

export async function saveOwnLinkOrder(linkIds: string[]): Promise<Link[]> {
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const profileId = await requireOwnedProfileId(client, userId);
  const currentLinks = await getOwnedLinks(client, profileId);
  const requestedIds = new Set(linkIds);

  if (
    requestedIds.size !== linkIds.length ||
    requestedIds.size !== currentLinks.length ||
    currentLinks.some((link) => !requestedIds.has(link.id))
  ) {
    throw new Error("The link order changed. Refresh and try again.");
  }

  const orderedLinks = linkIds.map((id, position) => {
    const link = currentLinks.find((current) => current.id === id);
    if (!link)
      throw new Error("The link order changed. Refresh and try again.");
    return { ...link, position };
  });

  if (orderedLinks.length === 0) return [];

  const { data, error } = await client
    .from("links")
    .upsert(orderedLinks, { onConflict: "id" })
    .select("*")
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}
