import { createClient } from "@/lib/supabase/client";
import { subscriberEmailSchema } from "@/shared/schemas";
import type { Database } from "@/lib/database.extended.types";
import {
  requireOwnedProfileId,
  requireSignedInUserId,
} from "@/lib/data/ownership";

export type Subscriber =
  Database["public"]["Tables"]["email_subscribers"]["Row"];

export async function listOwnSubscribers(): Promise<Subscriber[]> {
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const profileId = await requireOwnedProfileId(client, userId);
  const { data, error } = await client
    .from("email_subscribers")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function subscribeToProfile(
  profileId: string,
  email: string,
): Promise<void> {
  const normalizedEmail = subscriberEmailSchema
    .parse(email)
    .trim()
    .toLowerCase();
  const { error } = await createClient().from("email_subscribers").insert({
    profile_id: profileId,
    email: normalizedEmail,
  });

  if (error) throw error;
}
