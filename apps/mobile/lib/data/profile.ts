import type { SupabaseClient } from "@supabase/supabase-js";
import {
  bioSchema,
  displayNameSchema,
  themeSchema,
  usernameSchema,
} from "@/shared/schemas";

import { requireOwnedProfileId } from "@/lib/data/ownership";
import { supabase } from "@/lib/supabase";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  theme: string;
  created_at: string;
  updated_at: string;
}

export async function getOwnProfile(
  client: SupabaseClient = supabase,
): Promise<Profile | null> {
  const profileId = await requireOwnedProfileId(client);
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateOwnProfile(
  input: Partial<Pick<Profile, "username" | "display_name" | "bio" | "theme">>,
): Promise<Profile> {
  if (Object.keys(input).length === 0) {
    throw new Error("There are no profile changes to save.");
  }

  const updates: {
    username?: string;
    display_name?: string;
    bio?: string | null;
    theme?: string;
  } = {};
  if (input.username !== undefined) {
    updates.username = usernameSchema.parse(input.username);
  }
  if (input.display_name !== undefined) {
    updates.display_name = displayNameSchema.parse(input.display_name);
  }
  if (input.bio !== undefined) {
    updates.bio = bioSchema.parse(input.bio);
  }
  if (input.theme !== undefined) {
    updates.theme = themeSchema.parse(input.theme);
  }

  const profileId = await requireOwnedProfileId();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", profileId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Your profile could not be updated.");
  return data;
}
