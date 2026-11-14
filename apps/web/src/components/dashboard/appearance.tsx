"use client";

import { useState } from "react";
import {
  creatorCustomizationSchema,
  type CreatorCustomization,
  type CreatorDesignTheme,
} from "@/shared/schemas";
import type { CreatorTemplateKey } from "@/lib/database.extended.types";
import type { Profile } from "@/lib/data/profile";
import { updateOwnProfile, uploadOwnBackground } from "@/lib/data/profile";
import {
  applyDesignTheme,
  creatorTemplates,
  designThemes,
} from "@/lib/creator-templates";

interface AppearanceProps {
  profile: Profile;
  onSaved: (profile: Profile) => void;
  onDraftChange: (changes: Partial<Profile>) => void;
}

type SettingsPath = "background" | "typography" | "buttons";

const animationOptions: {
  value: CreatorCustomization["animation"];
  label: string;
}[] = [
  { value: "none", label: "None" },
  { value: "fade", label: "Smooth fade" },
  { value: "bounce", label: "Bounce" },
  { value: "pulse", label: "Pulse" },
  { value: "shine", label: "Shine" },
  { value: "float", label: "Floating" },
  { value: "scale", label: "Hover scale" },
  { value: "slide", label: "Slide" },
];

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function Appearance({
  profile,
  onSaved,
  onDraftChange,
}: AppearanceProps) {
  const parsedSettings = creatorCustomizationSchema.safeParse(
    profile.design_settings,
  );
  if (!parsedSettings.success) {
    throw new Error("The saved profile design is invalid.");
  }
  const settings = parsedSettings.data;
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);

  function updateDesign(nextSettings: CreatorCustomization) {
    onDraftChange({
      design_settings: nextSettings,
      accent_color: nextSettings.accentColor,
      button_style: nextSettings.buttons.shape,
    });
    setMessage("");
    setSaveFailed(false);
  }

  function updateGroup<T extends SettingsPath>(
    group: T,
    changes: Partial<CreatorCustomization[T]>,
  ) {
    updateDesign({
      ...settings,
      [group]: { ...settings[group], ...changes },
    });
  }

  function selectTheme(themeId: CreatorDesignTheme) {
    const theme = designThemes.find((item) => item.id === themeId);
    if (theme) updateDesign(applyDesignTheme(settings, theme));
  }

  function selectTemplate(templateKey: CreatorTemplateKey) {
    const template = creatorTemplates.find((item) => item.id === templateKey);
    if (!template) return;
    updateDesign({
      ...settings,
      accentColor: template.accent,
      background: {
        ...settings.background,
        type: "solid",
        color: template.surface,
      },
      typography: { ...settings.typography, textColor: template.ink },
    });
    onDraftChange({
      template_key: templateKey,
      accent_color: template.accent,
    });
  }

  async function handleBackgroundUpload(file: File | undefined) {
    if (!file || isUploading) return;
    setIsUploading(true);
    setMessage("");
    try {
      const asset = await uploadOwnBackground(file);
      updateGroup("background", {
        type: asset.type,
        imageUrl: asset.type === "image" ? asset.url : "",
        videoUrl: asset.type === "video" ? asset.url : "",
      });
      setMessage(
        asset.type === "image"
          ? "Optimized background image is ready to save."
          : "Background video is ready to save.",
      );
    } catch (error) {
      setSaveFailed(true);
      setMessage(
        getErrorMessage(error, "We could not upload this background."),
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function persistDesign(publish: boolean) {
    const validated = creatorCustomizationSchema.safeParse(settings);
    if (!validated.success || isSaving || isUploading) {
      if (!validated.success) {
        setSaveFailed(true);
        setMessage(
          validated.error.issues[0]?.message ?? "Check your design settings.",
        );
      }
      return;
    }

    setIsSaving(true);
    setMessage("");
    setSaveFailed(false);
    try {
      const savedProfile = await updateOwnProfile({
        design_settings: validated.data,
        accent_color: validated.data.accentColor,
        button_style: validated.data.buttons.shape,
        template_key: profile.template_key,
        ...(publish
          ? { published_design: validated.data, is_published: true }
          : {}),
      });
      onSaved(savedProfile);
      setMessage(
        publish
          ? "Your latest design is published."
          : "Changes saved. Publish when you are ready for visitors to see them.",
      );
    } catch (error) {
      setSaveFailed(true);
      setMessage(
        getErrorMessage(
          error,
          "We could not save your design. Please try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function unpublish() {
    if (isSaving) return;
    setIsSaving(true);
    setMessage("");
    setSaveFailed(false);
    try {
      const savedProfile = await updateOwnProfile({ is_published: false });
      onSaved(savedProfile);
      setMessage("Your page is unpublished and hidden from visitors.");
    } catch (error) {
      setSaveFailed(true);
      setMessage(
        getErrorMessage(
          error,
          "We could not unpublish your page. Please try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="dashboard-section" aria-labelledby="appearance-heading">
      <div className="dashboard-section-heading">
        <div>
          <h2 id="appearance-heading">Design &amp; themes</h2>
          <p>
            Every adjustment updates your live preview. Save drafts, then
            publish when ready.
          </p>
        </div>
        <span
          className={`design-publish-badge ${profile.is_published ? "is-published" : ""}`}
        >
          {profile.is_published ? "Published" : "Draft"}
        </span>
      </div>

      <fieldset className="advanced-design-section">
        <legend>Ready-made themes</legend>
        <div className="design-theme-grid">
          {designThemes.map((theme) => (
            <button
              className={`design-theme-card ${settings.theme === theme.id ? "is-selected" : ""}`}
              type="button"
              key={theme.id}
              aria-pressed={settings.theme === theme.id}
              disabled={isSaving || isUploading}
              onClick={() => selectTheme(theme.id)}
            >
              <span
                className="design-theme-swatch"
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.accent,
                }}
                aria-hidden="true"
              >
                <span style={{ backgroundColor: theme.accent }} />
                <span style={{ backgroundColor: theme.button }} />
              </span>
              <strong>{theme.name}</strong>
              <small>{theme.description}</small>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="advanced-design-section">
        <legend>Creator templates</legend>
        <p className="dashboard-muted">
          Keep your original Linkdot templates, then refine their details below.
        </p>
        <div className="creator-template-grid" aria-label="Creator templates">
          {creatorTemplates.map((template) => (
            <button
              className={`creator-template-card ${profile.template_key === template.id ? "is-selected" : ""}`}
              type="button"
              key={template.id}
              aria-pressed={profile.template_key === template.id}
              disabled={isSaving || isUploading}
              onClick={() => selectTemplate(template.id)}
            >
              <span
                className={`creator-template-sample template-sample-${template.id}`}
                style={{
                  backgroundColor: template.surface,
                  color: template.ink,
                }}
                aria-hidden="true"
              >
                <span className="creator-template-sample-avatar" />
                <span />
                <span />
                <span />
              </span>
              <span className="creator-template-name">{template.name}</span>
              <span className="creator-template-description">
                {template.description}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="advanced-design-section">
        <legend>Background</legend>
        <div className="design-control-grid">
          <label>
            Background type
            <select
              className="select select-bordered"
              value={settings.background.type}
              onChange={(event) =>
                updateGroup("background", {
                  type: event.target
                    .value as CreatorCustomization["background"]["type"],
                })
              }
            >
              <option value="solid">Solid color</option>
              <option value="gradient">Gradient</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </label>
          {settings.background.type === "solid" && (
            <label>
              Background color
              <input
                className="input input-bordered design-color-input"
                type="color"
                value={settings.background.color}
                onChange={(event) =>
                  updateGroup("background", { color: event.target.value })
                }
              />
            </label>
          )}
          {settings.background.type === "gradient" && (
            <>
              <label>
                Gradient start
                <input
                  className="input input-bordered design-color-input"
                  type="color"
                  value={settings.background.gradientStart}
                  onChange={(event) =>
                    updateGroup("background", {
                      gradientStart: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Gradient end
                <input
                  className="input input-bordered design-color-input"
                  type="color"
                  value={settings.background.gradientEnd}
                  onChange={(event) =>
                    updateGroup("background", {
                      gradientEnd: event.target.value,
                    })
                  }
                />
              </label>
            </>
          )}
          {(settings.background.type === "image" ||
            settings.background.type === "video") && (
            <label className="design-file-control">
              {settings.background.type === "image"
                ? "Upload background image"
                : "Upload background video"}
              <input
                className="file-input file-input-bordered"
                type="file"
                accept={
                  settings.background.type === "image"
                    ? "image/jpeg,image/png,image/webp"
                    : "video/mp4,video/webm"
                }
                disabled={isUploading || isSaving}
                onChange={(event) => {
                  void handleBackgroundUpload(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <small>
                {settings.background.type === "image"
                  ? "JPG, PNG, or WebP; images are optimized to WebP."
                  : "MP4 or WebM, up to 25 MB."}
              </small>
            </label>
          )}
          {(settings.background.type === "image" ||
            settings.background.type === "video") && (
            <>
              <label>
                Horizontal position: {settings.background.positionX}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.background.positionX}
                  onChange={(event) =>
                    updateGroup("background", {
                      positionX: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                Vertical position: {settings.background.positionY}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.background.positionY}
                  onChange={(event) =>
                    updateGroup("background", {
                      positionY: Number(event.target.value),
                    })
                  }
                />
              </label>
            </>
          )}
        </div>
      </fieldset>

      <fieldset className="advanced-design-section">
        <legend>Typography</legend>
        <div className="design-control-grid">
          <label>
            Font family
            <select
              className="select select-bordered"
              value={settings.typography.fontFamily}
              onChange={(event) =>
                updateGroup("typography", {
                  fontFamily: event.target
                    .value as CreatorCustomization["typography"]["fontFamily"],
                })
              }
            >
              <option value="outfit">Outfit</option>
              <option value="urbanist">Urbanist</option>
              <option value="georgia">Georgia</option>
              <option value="system">System sans-serif</option>
              <option value="mono">Monospace</option>
            </select>
          </label>
          <label>
            Font size
            <select
              className="select select-bordered"
              value={settings.typography.fontSize}
              onChange={(event) =>
                updateGroup("typography", {
                  fontSize: event.target
                    .value as CreatorCustomization["typography"]["fontSize"],
                })
              }
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
          <label>
            Font weight
            <select
              className="select select-bordered"
              value={settings.typography.fontWeight}
              onChange={(event) =>
                updateGroup("typography", {
                  fontWeight: event.target
                    .value as CreatorCustomization["typography"]["fontWeight"],
                })
              }
            >
              {(["400", "500", "600", "700", "800"] as const).map((weight) => (
                <option key={weight} value={weight}>
                  {weight}
                </option>
              ))}
            </select>
          </label>
          <label>
            Text color
            <input
              className="input input-bordered design-color-input"
              type="color"
              value={settings.typography.textColor}
              onChange={(event) =>
                updateGroup("typography", { textColor: event.target.value })
              }
            />
          </label>
          <label>
            Text alignment
            <select
              className="select select-bordered"
              value={settings.typography.alignment}
              onChange={(event) =>
                updateGroup("typography", {
                  alignment: event.target
                    .value as CreatorCustomization["typography"]["alignment"],
                })
              }
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="advanced-design-section">
        <legend>Link buttons</legend>
        <div className="design-control-grid">
          <label>
            Shape
            <select
              className="select select-bordered"
              value={settings.buttons.shape}
              onChange={(event) => {
                const shape = event.target
                  .value as CreatorCustomization["buttons"]["shape"];
                updateGroup("buttons", {
                  shape,
                  borderRadius:
                    shape === "pill" ? 40 : shape === "square" ? 0 : 16,
                });
              }}
            >
              <option value="rounded">Rounded</option>
              <option value="pill">Pill</option>
              <option value="square">Square</option>
            </select>
          </label>
          <label>
            Corner radius: {settings.buttons.borderRadius}px
            <input
              type="range"
              min="0"
              max="40"
              value={settings.buttons.borderRadius}
              onChange={(event) =>
                updateGroup("buttons", {
                  borderRadius: Number(event.target.value),
                })
              }
              disabled={settings.buttons.shape === "pill"}
            />
          </label>
          <label>
            Button color
            <input
              className="input input-bordered design-color-input"
              type="color"
              value={settings.buttons.color}
              onChange={(event) =>
                updateGroup("buttons", { color: event.target.value })
              }
            />
          </label>
          <label>
            Button text color
            <input
              className="input input-bordered design-color-input"
              type="color"
              value={settings.buttons.textColor}
              onChange={(event) =>
                updateGroup("buttons", { textColor: event.target.value })
              }
            />
          </label>
          <label>
            Button size
            <select
              className="select select-bordered"
              value={settings.buttons.size}
              onChange={(event) =>
                updateGroup("buttons", {
                  size: event.target
                    .value as CreatorCustomization["buttons"]["size"],
                })
              }
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
          <label>
            Shadow
            <select
              className="select select-bordered"
              value={settings.buttons.shadow}
              onChange={(event) =>
                updateGroup("buttons", {
                  shadow: event.target
                    .value as CreatorCustomization["buttons"]["shadow"],
                })
              }
            >
              <option value="none">None</option>
              <option value="soft">Soft</option>
              <option value="strong">Strong</option>
            </select>
          </label>
          <label>
            Icon
            <select
              className="select select-bordered"
              value={settings.buttons.icon}
              onChange={(event) =>
                updateGroup("buttons", {
                  icon: event.target
                    .value as CreatorCustomization["buttons"]["icon"],
                })
              }
            >
              <option value="none">None</option>
              <option value="link">Link</option>
              <option value="arrow">Arrow</option>
              <option value="sparkle">Sparkle</option>
              <option value="heart">Heart</option>
            </select>
          </label>
          <label>
            Hover animation
            <select
              className="select select-bordered"
              value={settings.buttons.hoverAnimation}
              onChange={(event) =>
                updateGroup("buttons", {
                  hoverAnimation: event.target
                    .value as CreatorCustomization["buttons"]["hoverAnimation"],
                })
              }
            >
              {animationOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="design-checkbox-control">
            <input
              className="checkbox checkbox-primary"
              type="checkbox"
              checked={settings.buttons.showThumbnails}
              onChange={(event) =>
                updateGroup("buttons", {
                  showThumbnails: event.target.checked,
                })
              }
            />
            Show uploaded link thumbnails
          </label>
          <label className="design-file-control">
            Shared button thumbnail
            <input
              className="file-input file-input-bordered"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isUploading || isSaving}
              onChange={async (event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                if (!file || isUploading) return;
                setIsUploading(true);
                try {
                  const asset = await uploadOwnBackground(file);
                  if (asset.type !== "image") {
                    throw new Error("Choose an image for a button thumbnail.");
                  }
                  updateGroup("buttons", { thumbnailUrl: asset.url });
                  setMessage("Optimized thumbnail is ready to save.");
                } catch (error) {
                  setSaveFailed(true);
                  setMessage(
                    getErrorMessage(
                      error,
                      "We could not upload this thumbnail.",
                    ),
                  );
                } finally {
                  setIsUploading(false);
                }
              }}
            />
            <small>Optional fallback image when a link has no thumbnail.</small>
          </label>
        </div>
      </fieldset>

      <fieldset className="advanced-design-section">
        <legend>Page animation</legend>
        <label className="design-field-narrow">
          Link entrance
          <select
            className="select select-bordered"
            value={settings.animation}
            onChange={(event) =>
              updateDesign({
                ...settings,
                animation: event.target
                  .value as CreatorCustomization["animation"],
              })
            }
          >
            {animationOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="dashboard-muted">
          Motion is automatically reduced for visitors who prefer reduced
          motion.
        </p>
      </fieldset>

      <div className="design-save-actions">
        <button
          className="btn btn-primary"
          type="button"
          disabled={isSaving || isUploading}
          onClick={() => void persistDesign(false)}
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
        <button
          className="btn btn-outline"
          type="button"
          disabled={isSaving || isUploading}
          onClick={() => void persistDesign(true)}
        >
          {isSaving
            ? "Publishing..."
            : profile.is_published
              ? "Publish changes"
              : "Publish"}
        </button>
        {profile.is_published && (
          <button
            className="btn btn-ghost"
            type="button"
            disabled={isSaving || isUploading}
            onClick={() => void unpublish()}
          >
            Unpublish
          </button>
        )}
      </div>

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
