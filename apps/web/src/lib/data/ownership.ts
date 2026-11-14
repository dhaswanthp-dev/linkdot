import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.extended.types";

export async function requireSignedInUserId(
  client: SupabaseClient<Database>,
): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Your session has expired. Sign in again.");
  return data.user.id;
}

export async function requireOwnedProfileId(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  const { data, error } = await client
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Create your profile before editing your page.");
  return data.id;
}
