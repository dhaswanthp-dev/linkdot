"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  bioSchema,
  displayNameSchema,
  socialLinksSchema,
  usernameSchema,
  type SocialLinks,
} from "@/shared/schemas";
import type { Profile } from "@/lib/data/profile";
import {
  isUsernameAvailable,
  updateOwnProfile,
  uploadOwnAvatar,
} from "@/lib/data/profile";

interface ProfileFormProps {
  profile: Profile;
  onSaved: (profile: Profile) => void;
  onDraftChange: (changes: Partial<Profile>) => void;
}

interface ProfileErrors {
  username?: string;
  displayName?: string;
  bio?: string;
  socialLinks?: Partial<Record<keyof SocialLinks, string>>;
}

const socialFields: { key: keyof SocialLinks; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "youtube", label: "YouTube" },
  { key: "facebook", label: "Facebook" },
  { key: "website", label: "Website" },
];

function getSocialLinks(value: Profile["social_links"]): SocialLinks {
  const parsed = socialLinksSchema.safeParse(value);
  return parsed.success ? parsed.data : socialLinksSchema.parse({});
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  return typeof error.code === "string" ? error.code : undefined;
}

export function ProfileForm({
  profile,
  onSaved,
  onDraftChange,
}: ProfileFormProps) {
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() =>
    getSocialLinks(profile.social_links),
  );
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  const usernameCheckId = useRef(0);
  const avatarPreviewRef = useRef("");

  useEffect(
    () => () => {
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
      }
    },
    [],
  );

  async function checkUsername() {
    const checkId = ++usernameCheckId.current;
    setAvailabilityMessage("");
    setIsCheckingUsername(false);
    if (username === profile.username) return;

    const parsedUsername = usernameSchema.safeParse(username);
    if (!parsedUsername.success) {
      setErrors((current) => ({
        ...current,
        username:
          parsedUsername.error.issues[0]?.message ?? "Enter a valid username.",
      }));
      return;
    }

    setErrors((current) => ({ ...current, username: undefined }));
    setIsCheckingUsername(true);
    try {
      const available = await isUsernameAvailable(username);
      if (checkId !== usernameCheckId.current) return;
      setAvailabilityMessage(
        available ? "Username is available." : "That username is taken",
      );
      setErrors((current) => ({
        ...current,
        username: available ? undefined : "That username is taken",
      }));
    } catch {
      if (checkId !== usernameCheckId.current) return;
      setAvailabilityMessage(
        "We could not check availability. Saving still verifies the username.",
      );
      setErrors((current) => ({ ...current, username: undefined }));
    } finally {
      if (checkId === usernameCheckId.current) setIsCheckingUsername(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const nextErrors: ProfileErrors = {};
    const parsedUsername = usernameSchema.safeParse(username);
    const parsedDisplayName = displayNameSchema.safeParse(displayName);
    const parsedBio = bioSchema.safeParse(bio === "" ? null : bio);
    const parsedSocialLinks = socialLinksSchema.safeParse(socialLinks);
    if (!parsedUsername.success) {
      nextErrors.username =
        parsedUsername.error.issues[0]?.message ?? "Enter a valid username.";
    } else if (
      username !== profile.username &&
      errors.username === "That username is taken"
    ) {
      nextErrors.username = "That username is taken";
    }
    if (!parsedDisplayName.success) {
      nextErrors.displayName =
        parsedDisplayName.error.issues[0]?.message ??
        "Enter a display name from 1 to 60 characters.";
    }
    if (!parsedBio.success) {
      nextErrors.bio = "Bio must be 80 characters or fewer.";
    }
    if (!parsedSocialLinks.success) {
      nextErrors.socialLinks = {};
      for (const issue of parsedSocialLinks.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && key in socialLinks) {
          nextErrors.socialLinks[key as keyof SocialLinks] = issue.message;
        }
      }
    }
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    setSaveFailed(false);
    try {
      const avatarUrl = avatarFile
        ? await uploadOwnAvatar(avatarFile)
        : profile.avatar_url;
      const savedProfile = await updateOwnProfile({
        username: parsedUsername.data,
        display_name: parsedDisplayName.data,
        bio: parsedBio.data,
        avatar_url: avatarUrl,
        social_links: parsedSocialLinks.data,
      });
      onSaved(savedProfile);
      setAvatarFile(null);
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
        avatarPreviewRef.current = "";
      }
      setSocialLinks(getSocialLinks(savedProfile.social_links));
      setMessage("Profile saved.");
    } catch (error) {
      const usernameTaken = getErrorCode(error) === "23505";
      if (usernameTaken) {
        setErrors((current) => ({
          ...current,
          username: "That username is taken",
        }));
      }
      setSaveFailed(true);
      setMessage(
        usernameTaken
          ? "That username is taken"
          : "We could not save your profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="dashboard-section" aria-labelledby="profile-heading">
      <div className="dashboard-section-heading">
        <div>
          <h2 id="profile-heading">Profile</h2>
          <p>Shape the details and social links people see on your page.</p>
        </div>
      </div>

      <form className="dashboard-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="profile-avatar">Profile photo</label>
        <input
          className="input input-bordered"
          id="profile-avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0] ?? null;
            event.currentTarget.value = "";
            if (avatarPreviewRef.current) {
              URL.revokeObjectURL(avatarPreviewRef.current);
            }
            const previewUrl = file ? URL.createObjectURL(file) : "";
            avatarPreviewRef.current = previewUrl;
            setAvatarFile(file);
            onDraftChange({ avatar_url: previewUrl || profile.avatar_url });
          }}
          aria-describedby="profile-avatar-help"
        />
        <p className="dashboard-muted" id="profile-avatar-help">
          JPG, PNG, or WebP, up to 15 MB. Images are optimized before upload.
          {avatarFile ? ` Selected: ${avatarFile.name}` : ""}
        </p>

        <label htmlFor="profile-display-name">Display name</label>
        <input
          className="input input-bordered"
          id="profile-display-name"
          autoComplete="name"
          maxLength={60}
          value={displayName}
          onChange={(event) => {
            setDisplayName(event.target.value);
            onDraftChange({ display_name: event.target.value });
          }}
          aria-invalid={Boolean(errors.displayName)}
          aria-describedby={
            errors.displayName ? "display-name-error" : undefined
          }
        />
        {errors.displayName && (
          <p className="dashboard-error" id="display-name-error" role="alert">
            {errors.displayName}
          </p>
        )}

        <label htmlFor="profile-bio">Bio</label>
        <textarea
          className="textarea textarea-bordered"
          id="profile-bio"
          maxLength={80}
          rows={3}
          value={bio}
          onChange={(event) => {
            setBio(event.target.value);
            onDraftChange({ bio: event.target.value || null });
          }}
          aria-invalid={Boolean(errors.bio)}
          aria-describedby={errors.bio ? "bio-error bio-count" : "bio-count"}
        />
        <p className="dashboard-muted" id="bio-count">
          {bio.length}/80 characters
        </p>
        {errors.bio && (
          <p className="dashboard-error" id="bio-error" role="alert">
            {errors.bio}
          </p>
        )}

        <label htmlFor="profile-username">Username</label>
        <div className="username-input-row">
          <span aria-hidden="true">linkdot.co/</span>
          <input
            className="input input-bordered"
            id="profile-username"
            autoComplete="username"
            maxLength={30}
            value={username}
            onChange={(event) => {
              usernameCheckId.current += 1;
              setIsCheckingUsername(false);
              setUsername(event.target.value);
              onDraftChange({ username: event.target.value });
              setErrors((current) => ({ ...current, username: undefined }));
              setAvailabilityMessage("");
            }}
            onBlur={() => void checkUsername()}
            aria-invalid={Boolean(errors.username)}
            aria-describedby={
              errors.username
                ? "username-error"
                : availabilityMessage
                  ? "username-availability"
                  : "username-help"
            }
          />
        </div>
        <p className="dashboard-muted" id="username-help">
          Use 3–30 lowercase letters, numbers, or underscores.
        </p>
        {errors.username && (
          <p className="dashboard-error" id="username-error" role="alert">
            {errors.username}
          </p>
        )}
        {isCheckingUsername && (
          <p className="dashboard-muted" role="status">
            Checking username...
          </p>
        )}
        {!errors.username && availabilityMessage && (
          <p
            className="dashboard-muted"
            id="username-availability"
            role="status"
          >
            {availabilityMessage}
          </p>
        )}

        <fieldset className="profile-social-fields">
          <legend>Social links</legend>
          {socialFields.map(({ key, label }) => (
            <div className="dashboard-form-field" key={key}>
              <label htmlFor={`social-${key}`}>{label}</label>
              <input
                className="input input-bordered"
                id={`social-${key}`}
                type="url"
                inputMode="url"
                placeholder="https://"
                value={socialLinks[key]}
                onChange={(event) => {
                  const nextLinks = {
                    ...socialLinks,
                    [key]: event.target.value,
                  };
                  setSocialLinks(nextLinks);
                  onDraftChange({ social_links: nextLinks });
                }}
                aria-invalid={Boolean(errors.socialLinks?.[key])}
                aria-describedby={
                  errors.socialLinks?.[key] ? `social-${key}-error` : undefined
                }
              />
              {errors.socialLinks?.[key] && (
                <p
                  className="dashboard-error"
                  id={`social-${key}-error`}
                  role="alert"
                >
                  {errors.socialLinks[key]}
                </p>
              )}
            </div>
          ))}
        </fieldset>

        <button className="btn btn-primary" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </form>

      {message && (
        <p
          className={saveFailed ? "dashboard-error" : "dashboard-status"}
          role={saveFailed ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </section>
  );
}
