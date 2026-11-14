import { creatorBlockSchema } from "@/shared/schemas";
import type { Database, CreatorBlockType } from "@/lib/database.extended.types";
import { createClient } from "@/lib/supabase/client";
import {
  requireOwnedProfileId,
  requireSignedInUserId,
} from "@/lib/data/ownership";

export type CreatorBlock =
  Database["public"]["Tables"]["creator_blocks"]["Row"];

export type CreatorBlockInput = {
  block_type: CreatorBlockType;
  title: string;
  description: string | null;
  href: string | null;
  media_urls: string[];
  is_visible?: boolean;
};

export async function listOwnCreatorBlocks(): Promise<CreatorBlock[]> {
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const profileId = await requireOwnedProfileId(client, userId);
  const { data, error } = await client
    .from("creator_blocks")
    .select("*")
    .eq("profile_id", profileId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createOwnCreatorBlock(
  input: CreatorBlockInput,
): Promise<CreatorBlock> {
  const parsed = creatorBlockSchema.parse({ ...input, is_visible: true });
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const profileId = await requireOwnedProfileId(client, userId);
  const { data: current, error: listError } = await client
    .from("creator_blocks")
    .select("position")
    .eq("profile_id", profileId)
    .order("position", { ascending: false })
    .limit(1);

  if (listError) throw listError;
  const { data, error } = await client
    .from("creator_blocks")
    .insert({
      ...parsed,
      profile_id: profileId,
      position: current[0] ? current[0].position + 1 : 0,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateOwnCreatorBlock(
  blockId: string,
  input: CreatorBlockInput,
): Promise<CreatorBlock> {
  const parsed = creatorBlockSchema.parse(input);
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const profileId = await requireOwnedProfileId(client, userId);
  const { data, error } = await client
    .from("creator_blocks")
    .update(parsed)
    .eq("id", blockId)
    .eq("profile_id", profileId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("That content block is not in your profile.");
  return data;
}

export async function deleteOwnCreatorBlock(blockId: string): Promise<void> {
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const profileId = await requireOwnedProfileId(client, userId);
  const { data, error } = await client
    .from("creator_blocks")
    .delete()
    .eq("id", blockId)
    .eq("profile_id", profileId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("That content block is not in your profile.");
}

export async function saveOwnCreatorBlockOrder(
  blockIds: string[],
): Promise<CreatorBlock[]> {
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const profileId = await requireOwnedProfileId(client, userId);
  const { data: current, error: readError } = await client
    .from("creator_blocks")
    .select("*")
    .eq("profile_id", profileId)
    .order("position", { ascending: true });

  if (readError) throw readError;
  const requested = new Set(blockIds);
  if (
    requested.size !== blockIds.length ||
    requested.size !== current.length ||
    current.some((block) => !requested.has(block.id))
  ) {
    throw new Error("The content order changed. Refresh and try again.");
  }

  const { data, error } = await client
    .from("creator_blocks")
    .upsert(
      blockIds.map((id, position) => {
        const block = current.find((item) => item.id === id);
        if (!block) throw new Error("The content order changed.");
        return { ...block, position };
      }),
      { onConflict: "id" },
    )
    .select("*")
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getPublicCreatorBlocks(username: string) {
  const { data, error } = await createClient()
    .from("public_creator_blocks")
    .select("*")
    .eq("username", username)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}
