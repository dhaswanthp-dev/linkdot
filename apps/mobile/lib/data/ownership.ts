import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export async function requireOwnedProfileId(
  client: SupabaseClient = supabase,
): Promise<string> {
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user)
    throw new Error("Your session has expired. Sign in again.");

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile)
    throw new Error("Create your profile before editing your page.");

  return profile.id;
}
