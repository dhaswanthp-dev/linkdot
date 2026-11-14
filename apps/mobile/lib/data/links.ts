import type { SupabaseClient } from "@supabase/supabase-js";
import { linkTitleSchema, linkUrlSchema } from "@/shared/schemas";

import { requireOwnedProfileId } from "@/lib/data/ownership";
import { supabase } from "@/lib/supabase";

export interface Link {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  position: number;
  is_visible: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

async function getOwnedLinks(
  client: SupabaseClient,
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

export async function listOwnLinks(
  client: SupabaseClient = supabase,
): Promise<Link[]> {
  const profileId = await requireOwnedProfileId(client);
  return getOwnedLinks(client, profileId);
}

export async function createOwnLink(input: {
  title: string;
  url: string;
}): Promise<Link> {
  const title = linkTitleSchema.parse(input.title);
  const url = linkUrlSchema.parse(input.url);
  const profileId = await requireOwnedProfileId();
  const currentLinks = await getOwnedLinks(supabase, profileId);
  const position =
    currentLinks.length > 0
      ? Math.max(...currentLinks.map((link) => link.position)) + 1
      : 0;

  const { data, error } = await supabase
    .from("links")
    .insert({ profile_id: profileId, title, url, position })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateOwnLink(
  linkId: string,
  changes: Partial<Pick<Link, "title" | "url">>,
): Promise<Link> {
  const updates: { title?: string; url?: string } = {};
  if (changes.title !== undefined) {
    updates.title = linkTitleSchema.parse(changes.title);
  }
  if (changes.url !== undefined) {
    updates.url = linkUrlSchema.parse(changes.url);
  }
  if (Object.keys(updates).length === 0) {
    throw new Error("There are no link changes to save.");
  }

  const profileId = await requireOwnedProfileId();
  const { data, error } = await supabase
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

export async function toggleOwnLinkVisibility(
  linkId: string,
  isVisible: boolean,
): Promise<Link> {
  const profileId = await requireOwnedProfileId();
  const { data, error } = await supabase
    .from("links")
    .update({ is_visible: isVisible })
    .eq("id", linkId)
    .eq("profile_id", profileId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("That link could not be found in your profile.");
  return data;
}

export async function deleteOwnLink(linkId: string): Promise<void> {
  const profileId = await requireOwnedProfileId();
  const { data, error } = await supabase
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
  const profileId = await requireOwnedProfileId();
  const currentLinks = await getOwnedLinks(supabase, profileId);
  const requestedIds = new Set(linkIds);

  if (
    requestedIds.size !== linkIds.length ||
    requestedIds.size !== currentLinks.length ||
    currentLinks.some((link) => !requestedIds.has(link.id))
  ) {
    throw new Error("The link order changed. Refresh and try again.");
  }

  const linksById = new Map(currentLinks.map((link) => [link.id, link]));
  const orderedLinks = linkIds.map((id, position) => {
    const link = linksById.get(id);
    if (!link)
      throw new Error("The link order changed. Refresh and try again.");
    return { ...link, position };
  });

  if (orderedLinks.length === 0) return [];

  const { data, error } = await supabase
    .from("links")
    .upsert(orderedLinks, { onConflict: "id" })
    .select("*")
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}
