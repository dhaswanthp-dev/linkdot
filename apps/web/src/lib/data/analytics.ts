import { profileAnalyticsSchema } from "@/shared/schemas";
import type { Database } from "@/lib/database.extended.types";
import { createClient } from "@/lib/supabase/client";
import { requireOwnedProfileId, requireSignedInUserId } from "./ownership";

export type ProfileAnalytics = ReturnType<typeof profileAnalyticsSchema.parse>;

export async function getOwnProfileAnalytics(
  days: 1 | 7 | 30,
): Promise<ProfileAnalytics> {
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  await requireOwnedProfileId(client, userId);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await client.rpc("get_own_profile_analytics", {
    p_since: since,
  });

  if (error) throw error;
  return profileAnalyticsSchema.parse(data);
}

export async function recordProfileVisit(input: {
  profileId: string;
  visitorId: string;
  sourceDomain: string | null;
}): Promise<void> {
  const client = createClient();
  const { error } = await client.from("profile_visits").insert({
    profile_id: input.profileId,
    visitor_id: input.visitorId,
    source_domain: input.sourceDomain,
  });

  if (error) throw error;
}

export async function recordLinkClick(
  linkId: string,
  referrer: string | null,
): Promise<void> {
  const { error } = await createClient().from("link_clicks").insert({
    link_id: linkId,
    referrer,
  });

  if (error) throw error;
}

export type AnalyticsJson =
  Database["public"]["Functions"]["get_own_profile_analytics"]["Returns"];
