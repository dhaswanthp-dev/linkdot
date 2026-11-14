import {
  accentColorSchema,
  bioSchema,
  buttonStyleSchema,
  creatorCustomizationSchema,
  creatorTemplateSchema,
  displayNameSchema,
  socialLinksSchema,
  themeSchema,
  usernameSchema,
} from "@/shared/schemas";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.extended.types";
import { requireSignedInUserId } from "@/lib/data/ownership";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | "username"
    | "display_name"
    | "bio"
    | "theme"
    | "avatar_url"
    | "template_key"
    | "accent_color"
    | "button_style"
    | "design_settings"
    | "is_published"
    | "published_design"
    | "social_links"
  >
>;

export async function getOwnProfile(): Promise<Profile | null> {
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createOwnProfile(input: {
  username: string;
  display_name: string;
}): Promise<Profile> {
  const username = usernameSchema.parse(input.username);
  const displayName = displayNameSchema.parse(input.display_name);
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const { data, error } = await client
    .from("profiles")
    .insert({
      id: userId,
      username,
      display_name: displayName,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateOwnProfile(input: ProfileUpdate): Promise<Profile> {
  if (Object.keys(input).length === 0) {
    throw new Error("There are no profile changes to save.");
  }

  const updates: Database["public"]["Tables"]["profiles"]["Update"] = {};
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
  if (input.avatar_url !== undefined) {
    if (
      input.avatar_url !== null &&
      (input.avatar_url.length > 2048 || !/^https:\/\//i.test(input.avatar_url))
    ) {
      throw new Error("Profile photos must use a secure HTTPS URL.");
    }
    updates.avatar_url = input.avatar_url;
  }
  if (input.template_key !== undefined) {
    updates.template_key = creatorTemplateSchema.parse(input.template_key);
  }
  if (input.accent_color !== undefined) {
    updates.accent_color = accentColorSchema.parse(input.accent_color);
  }
  if (input.button_style !== undefined) {
    updates.button_style = buttonStyleSchema.parse(input.button_style);
  }
  if (input.social_links !== undefined) {
    updates.social_links = socialLinksSchema.parse(input.social_links);
  }
  if (input.design_settings !== undefined) {
    updates.design_settings = creatorCustomizationSchema.parse(
      input.design_settings,
    );
  }
  if (input.published_design !== undefined) {
    updates.published_design =
      input.published_design === null
        ? null
        : creatorCustomizationSchema.parse(input.published_design);
  }
  if (input.is_published !== undefined) {
    if (typeof input.is_published !== "boolean") {
      throw new Error("Publish status must be true or false.");
    }
    if (input.is_published && input.published_design === undefined) {
      throw new Error("Save a design snapshot before publishing.");
    }
    updates.is_published = input.is_published;
  }

  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const { data, error } = await client
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Your profile could not be updated.");
  return data;
}

export async function uploadOwnAvatar(file: File): Promise<string> {
  return uploadOwnImage(file, "avatar");
}

export async function uploadOwnMedia(file: File): Promise<string> {
  return uploadOwnImage(file, "media");
}

async function optimizeImage(file: File): Promise<Blob> {
  const allowedTypes = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ]);
  if (!allowedTypes.has(file.type) || file.size > 15 * 1024 * 1024) {
    throw new Error("Choose a JPG, PNG, or WebP image smaller than 15 MB.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000) {
      throw new Error("This image has too many pixels to upload safely.");
    }
    const scale = Math.min(1, 1920 / bitmap.width, 1920 / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image optimization is not supported here.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const optimized = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("This image could not be optimized.")),
        "image/webp",
        0.8,
      );
    });
    if (optimized.size > 5 * 1024 * 1024) {
      throw new Error(
        "This image is still larger than 5 MB after optimization. Choose a smaller image.",
      );
    }
    return optimized;
  } finally {
    bitmap.close();
  }
}

async function uploadOwnImage(file: File, folder: "avatar" | "media") {
  const optimized = await optimizeImage(file);
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const path =
    folder === "avatar"
      ? `${userId}/avatar.webp`
      : `${userId}/media/${crypto.randomUUID()}.webp`;
  const { error } = await client.storage
    .from("linkdot-media")
    .upload(path, optimized, {
      upsert: folder === "avatar",
      contentType: "image/webp",
    });

  if (error) throw error;
  const { data } = client.storage.from("linkdot-media").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadOwnBackground(file: File): Promise<{
  type: "image" | "video";
  url: string;
}> {
  const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  const videoTypes = new Map([
    ["video/mp4", "mp4"],
    ["video/webm", "webm"],
  ]);
  const isImage = imageTypes.has(file.type);
  const videoExtension = videoTypes.get(file.type);
  if (isImage && file.size > 15 * 1024 * 1024) {
    throw new Error("Choose an image smaller than 15 MB.");
  }
  if (videoExtension && file.size > 25 * 1024 * 1024) {
    throw new Error("Choose an MP4 or WebM video smaller than 25 MB.");
  }
  if (!isImage && !videoExtension) {
    throw new Error("Choose a JPG, PNG, WebP, MP4, or WebM file.");
  }

  const content = isImage ? await optimizeImage(file) : file;
  const extension = isImage ? "webp" : videoExtension;
  const contentType = isImage ? "image/webp" : file.type;
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const path = `${userId}/backgrounds/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage
    .from("linkdot-media")
    .upload(path, content, { contentType });
  if (error) throw error;
  const { data } = client.storage.from("linkdot-media").getPublicUrl(path);
  return { type: isImage ? "image" : "video", url: data.publicUrl };
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  usernameSchema.parse(username);
  const client = createClient();
  const userId = await requireSignedInUserId(client);
  const { data, error } = await client
    .from("public_profiles")
    .select("id")
    .eq("username", username)
    .neq("id", userId)
    .limit(1);

  if (error) throw error;
  return data.length === 0;
}
