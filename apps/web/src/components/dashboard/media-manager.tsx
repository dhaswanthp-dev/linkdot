"use client";

import { useState, type FormEvent } from "react";
import { creatorBlockTypeSchema, creatorBlockSchema } from "@/shared/schemas";
import type { CreatorBlockType } from "@/lib/database.extended.types";
import {
  createOwnCreatorBlock,
  deleteOwnCreatorBlock,
  saveOwnCreatorBlockOrder,
  updateOwnCreatorBlock,
  type CreatorBlock,
  type CreatorBlockInput,
} from "@/lib/data/creator-content";
import { uploadOwnMedia } from "@/lib/data/profile";

interface MediaManagerProps {
  initialBlocks: CreatorBlock[];
  onBlocksChange: (blocks: CreatorBlock[]) => void;
}

const blockOptions: { value: CreatorBlockType; label: string }[] = [
  { value: "video", label: "YouTube video" },
  { value: "image", label: "Image" },
  { value: "gallery", label: "Image gallery" },
  { value: "product", label: "Product" },
  { value: "service", label: "Service" },
  { value: "donation", label: "Donation link" },
  { value: "digital_download", label: "Digital download" },
  { value: "subscription", label: "Subscription link" },
  { value: "contact", label: "Contact button" },
  { value: "newsletter", label: "Newsletter signup" },
];

export function MediaManager({
  initialBlocks,
  onBlocksChange,
}: MediaManagerProps) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [blockType, setBlockType] = useState<CreatorBlockType>("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [href, setHref] = useState("");
  const [mediaText, setMediaText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  function updateBlocks(nextBlocks: CreatorBlock[]) {
    setBlocks(nextBlocks);
    onBlocksChange(nextBlocks);
  }

  function resetForm() {
    setBlockType("video");
    setTitle("");
    setDescription("");
    setHref("");
    setMediaText("");
    setFiles([]);
    setEditingId(null);
    setIsVisible(true);
  }

  function getInput(): CreatorBlockInput {
    const parsedType = creatorBlockTypeSchema.parse(blockType);
    return {
      block_type: parsedType,
      title,
      description: description.trim() || null,
      href: href.trim() || null,
      media_urls: mediaText
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean),
      is_visible: isVisible,
    };
  }

  async function saveBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    let input: CreatorBlockInput;
    try {
      input = getInput();
      const preflightInput =
        files.length > 0 && input.media_urls.length === 0
          ? {
              ...input,
              media_urls: ["https://linkdot-upload.invalid/pending.webp"],
            }
          : input;
      const parsed = creatorBlockSchema.safeParse(preflightInput);
      if (!parsed.success) {
        setFailed(true);
        setMessage(parsed.error.issues[0]?.message ?? "Check this content.");
        return;
      }
    } catch {
      setFailed(true);
      setMessage("Choose a supported content type.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    setFailed(false);
    try {
      if (files.length > 12) {
        throw new Error("You can upload up to 12 images per content block.");
      }
      const uploadedUrls = await Promise.all(files.map(uploadOwnMedia));
      input.media_urls = [...input.media_urls, ...uploadedUrls];
      input = creatorBlockSchema.parse(input);
      const saved = editingId
        ? await updateOwnCreatorBlock(editingId, input)
        : await createOwnCreatorBlock(input);
      const nextBlocks = editingId
        ? blocks.map((block) => (block.id === saved.id ? saved : block))
        : [...blocks, saved].sort((a, b) => a.position - b.position);
      updateBlocks(nextBlocks);
      resetForm();
      setMessage(editingId ? "Content updated." : "Content added.");
    } catch (saveError) {
      setFailed(true);
      setMessage(
        saveError instanceof Error
          ? saveError.message
          : "We could not save this content. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function editBlock(block: CreatorBlock) {
    setEditingId(block.id);
    setBlockType(block.block_type);
    setTitle(block.title);
    setDescription(block.description ?? "");
    setHref(block.href ?? "");
    setMediaText(block.media_urls.join("\n"));
    setFiles([]);
    setIsVisible(block.is_visible);
    setMessage("");
  }

  async function toggleVisibility(block: CreatorBlock) {
    if (isSaving) return;
    setIsSaving(true);
    setMessage("");
    try {
      const saved = await updateOwnCreatorBlock(block.id, {
        block_type: block.block_type,
        title: block.title,
        description: block.description,
        href: block.href,
        media_urls: block.media_urls,
        is_visible: !block.is_visible,
      });
      updateBlocks(blocks.map((item) => (item.id === saved.id ? saved : item)));
      setMessage(
        saved.is_visible ? "Content is visible." : "Content is hidden.",
      );
    } catch {
      setFailed(true);
      setMessage("We could not update visibility. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (isSaving || target < 0 || target >= blocks.length) return;
    const reordered = [...blocks];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(target, 0, moved);
    setIsSaving(true);
    setMessage("");
    try {
      updateBlocks(
        await saveOwnCreatorBlockOrder(reordered.map((item) => item.id)),
      );
      setMessage("Content order saved.");
    } catch {
      setFailed(true);
      setMessage("We could not save the content order.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeBlock(block: CreatorBlock) {
    if (isSaving || !window.confirm(`Delete "${block.title}"?`)) return;
    setIsSaving(true);
    setMessage("");
    try {
      await deleteOwnCreatorBlock(block.id);
      updateBlocks(blocks.filter((item) => item.id !== block.id));
      setMessage("Content removed.");
    } catch {
      setFailed(true);
      setMessage("We could not remove this content.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="dashboard-section" aria-labelledby="media-heading">
      <div className="dashboard-section-heading">
        <div>
          <h2 id="media-heading">Media &amp; offers</h2>
          <p>Arrange video, galleries, services, and external offers.</p>
        </div>
      </div>

      <form className="creator-block-form" onSubmit={saveBlock} noValidate>
        <div className="dashboard-form-field">
          <label htmlFor="creator-block-type">Content type</label>
          <select
            className="select select-bordered"
            id="creator-block-type"
            value={blockType}
            onChange={(event) => {
              const selected = blockOptions.find(
                (option) => option.value === event.target.value,
              );
              if (selected) setBlockType(selected.value);
            }}
          >
            {blockOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="dashboard-form-field">
          <label htmlFor="creator-block-title">Title</label>
          <input
            className="input input-bordered"
            id="creator-block-title"
            value={title}
            maxLength={100}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>
        <div className="dashboard-form-field">
          <label htmlFor="creator-block-description">Description</label>
          <textarea
            className="textarea textarea-bordered"
            id="creator-block-description"
            value={description}
            maxLength={500}
            rows={2}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="dashboard-form-field">
          <label htmlFor="creator-block-url">
            {blockType === "contact"
              ? "Contact URL or email"
              : "Video or offer URL"}
          </label>
          <input
            className="input input-bordered"
            id="creator-block-url"
            type="text"
            inputMode="url"
            value={href}
            placeholder="https://"
            onChange={(event) => setHref(event.target.value)}
          />
        </div>
        <div className="dashboard-form-field">
          <label htmlFor="creator-block-media">Image URLs</label>
          <textarea
            className="textarea textarea-bordered"
            id="creator-block-media"
            value={mediaText}
            rows={3}
            placeholder="Add one secure image URL per line"
            onChange={(event) => setMediaText(event.target.value)}
          />
        </div>
        <div className="dashboard-form-field">
          <label htmlFor="creator-block-upload">Upload images</label>
          <input
            className="input input-bordered"
            id="creator-block-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) =>
              setFiles(Array.from(event.currentTarget.files ?? []))
            }
          />
          <p className="dashboard-muted">
            Up to 12 JPG, PNG, or WebP images, 5 MB each.
          </p>
        </div>
        {editingId && (
          <label className="creator-block-visible">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(event) => setIsVisible(event.target.checked)}
            />
            Show this block on my page
          </label>
        )}
        <div className="creator-block-form-actions">
          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving
              ? "Saving..."
              : editingId
                ? "Save content"
                : "Add content"}
          </button>
          {editingId && (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={resetForm}
              disabled={isSaving}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <p className="dashboard-muted monetization-note">
        Product, donation, and subscription buttons open your external provider.
        Linkdot does not process payments or show simulated purchase success.
      </p>

      {message && (
        <p
          className={failed ? "dashboard-error" : "dashboard-status"}
          role={failed ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      {blocks.length === 0 ? (
        <p className="dashboard-muted">
          Your public page has no media or offers yet.
        </p>
      ) : (
        <ol className="creator-block-list" aria-label="Profile content">
          {blocks.map((block, index) => (
            <li
              className={`creator-block-row ${block.is_visible ? "" : "is-hidden"}`}
              key={block.id}
            >
              <div>
                <span className="creator-block-type">
                  {
                    blockOptions.find(
                      (option) => option.value === block.block_type,
                    )?.label
                  }
                </span>
                <strong>{block.title}</strong>
                {block.description && <p>{block.description}</p>}
              </div>
              <div className="creator-block-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => void moveBlock(index, -1)}
                  disabled={isSaving || index === 0}
                  aria-label={`Move ${block.title} up`}
                >
                  ↑
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => void moveBlock(index, 1)}
                  disabled={isSaving || index === blocks.length - 1}
                  aria-label={`Move ${block.title} down`}
                >
                  ↓
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => void toggleVisibility(block)}
                  disabled={isSaving}
                >
                  {block.is_visible ? "Hide" : "Show"}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  onClick={() => editBlock(block)}
                  disabled={isSaving}
                >
                  Edit
                </button>
                <button
                  className="btn btn-outline btn-error btn-sm"
                  type="button"
                  onClick={() => void removeBlock(block)}
                  disabled={isSaving}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
