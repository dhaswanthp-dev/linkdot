"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useState, type FormEvent } from "react";
import { linkTitleSchema, linkUrlSchema } from "@/shared/schemas";
import {
  createOwnLink,
  deleteOwnLink,
  saveOwnLinkOrder,
  updateOwnLink,
  type Link,
} from "@/lib/data/links";
import { uploadOwnMedia } from "@/lib/data/profile";
import Image from "next/image";

interface LinksEditorProps {
  initialLinks: Link[];
  onLinksChange?: (links: Link[]) => void;
}

interface LinkErrors {
  title?: string;
  url?: string;
}

interface SortableLinkRowProps {
  link: Link;
  index: number;
  count: number;
  disabled: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onToggle: (link: Link) => void;
  onDelete: (link: Link) => void;
  editingId: string | null;
  editTitle: string;
  editUrl: string;
  editErrors: LinkErrors;
  onStartEdit: (link: Link) => void;
  onCancelEdit: () => void;
  onEditTitleChange: (value: string) => void;
  onEditUrlChange: (value: string) => void;
  onSaveEdit: (link: Link) => void;
  onUploadThumbnail: (link: Link, file: File) => void;
}

function SortableLinkRow({
  link,
  index,
  count,
  disabled,
  onMove,
  onToggle,
  onDelete,
  editingId,
  editTitle,
  editUrl,
  editErrors,
  onStartEdit,
  onCancelEdit,
  onEditTitleChange,
  onEditUrlChange,
  onSaveEdit,
  onUploadThumbnail,
}: SortableLinkRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id, disabled });
  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`
      : undefined,
    transition,
  };
  const isEditing = editingId === link.id;

  return (
    <li
      ref={setNodeRef}
      className={`link-row ${link.is_visible ? "" : "link-row-hidden"} ${isDragging ? "link-row-dragging" : ""}`}
      style={style}
    >
      <div className="link-row-main">
        <button
          className="btn btn-ghost btn-sm link-drag-handle"
          type="button"
          aria-label={`Drag to reorder ${link.title}`}
          {...attributes}
          {...listeners}
          disabled={disabled}
        >
          <span aria-hidden="true">⠿</span>
        </button>

        <div className="link-row-content">
          {isEditing ? (
            <div className="link-edit-fields">
              <label htmlFor={`edit-title-${link.id}`}>Title</label>
              <input
                className="input input-bordered"
                id={`edit-title-${link.id}`}
                value={editTitle}
                maxLength={100}
                onChange={(event) => onEditTitleChange(event.target.value)}
                aria-invalid={Boolean(editErrors.title)}
                aria-describedby={
                  editErrors.title ? `edit-title-error-${link.id}` : undefined
                }
              />
              {editErrors.title && (
                <p
                  className="dashboard-error"
                  id={`edit-title-error-${link.id}`}
                  role="alert"
                >
                  {editErrors.title}
                </p>
              )}
              <label htmlFor={`edit-url-${link.id}`}>URL</label>
              <input
                className="input input-bordered"
                id={`edit-url-${link.id}`}
                value={editUrl}
                type="text"
                inputMode="url"
                onChange={(event) => onEditUrlChange(event.target.value)}
                aria-invalid={Boolean(editErrors.url)}
                aria-describedby={
                  editErrors.url ? `edit-url-error-${link.id}` : undefined
                }
              />
              {editErrors.url && (
                <p
                  className="dashboard-error"
                  id={`edit-url-error-${link.id}`}
                  role="alert"
                >
                  {editErrors.url}
                </p>
              )}
              <div className="link-row-actions">
                <button
                  className="btn btn-primary btn-sm"
                  type="button"
                  onClick={() => onSaveEdit(link)}
                  disabled={disabled}
                >
                  Save
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={onCancelEdit}
                  disabled={disabled}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {link.thumbnail_url && (
                <Image
                  className="link-row-thumbnail"
                  src={link.thumbnail_url}
                  alt=""
                  width={56}
                  height={56}
                  unoptimized
                />
              )}
              <strong>{link.title}</strong>
              <a href={link.url} target="_blank" rel="noreferrer">
                {link.url}
              </a>
              <label className="link-thumbnail-upload">
                {link.thumbnail_url ? "Replace thumbnail" : "Add thumbnail"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={disabled}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    if (file) onUploadThumbnail(link, file);
                  }}
                />
              </label>
            </>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="link-row-controls">
          <label className="link-visibility-control">
            <input
              className="toggle toggle-primary"
              type="checkbox"
              checked={link.is_visible}
              onChange={() => onToggle(link)}
              disabled={disabled}
              aria-label={`${link.is_visible ? "Hide" : "Show"} ${link.title}`}
            />
            <span>{link.is_visible ? "Shown" : "Hidden"}</span>
          </label>
          <div className="link-row-actions">
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={() => onMove(index, -1)}
              disabled={disabled || index === 0}
              aria-label={`Move ${link.title} up`}
            >
              Move up
            </button>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={() => onMove(index, 1)}
              disabled={disabled || index === count - 1}
              aria-label={`Move ${link.title} down`}
            >
              Move down
            </button>
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={() => onStartEdit(link)}
              disabled={disabled}
            >
              Edit
            </button>
            <button
              className="btn btn-outline btn-error btn-sm"
              type="button"
              onClick={() => onDelete(link)}
              disabled={disabled}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function moveItem(links: Link[], from: number, to: number): Link[] {
  const reordered = [...links];
  const [moved] = reordered.splice(from, 1);
  if (!moved) return links;
  reordered.splice(to, 0, moved);
  return reordered;
}

export function LinksEditor({ initialLinks, onLinksChange }: LinksEditorProps) {
  const [links, setLinks] = useState(initialLinks);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [addErrors, setAddErrors] = useState<LinkErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editErrors, setEditErrors] = useState<LinkErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [writeFailed, setWriteFailed] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    onLinksChange?.(links);
  }, [links, onLinksChange]);

  function showMessage(nextMessage: string, failed = false) {
    setMessage(nextMessage);
    setWriteFailed(failed);
  }

  async function persistOrder(nextLinks: Link[]) {
    const previousLinks = links;
    setLinks(nextLinks);
    setIsSaving(true);
    showMessage("");
    try {
      const savedLinks = await saveOwnLinkOrder(
        nextLinks.map((link) => link.id),
      );
      setLinks(savedLinks);
      showMessage("Link order saved.");
    } catch {
      setLinks(previousLinks);
      showMessage(
        "We could not save the new order. Your previous order was restored.",
        true,
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || isSaving) return;
    const from = links.findIndex((link) => link.id === active.id);
    const to = links.findIndex((link) => link.id === over.id);
    if (from >= 0 && to >= 0) void persistOrder(moveItem(links, from, to));
  }

  function moveBy(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= links.length || isSaving) return;
    void persistOrder(moveItem(links, index, nextIndex));
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const parsedTitle = linkTitleSchema.safeParse(title);
    const parsedUrl = linkUrlSchema.safeParse(url);
    const nextErrors: LinkErrors = {};
    if (!parsedTitle.success) {
      nextErrors.title =
        parsedTitle.error.issues[0]?.message ?? "Enter a link title.";
    }
    if (!parsedUrl.success) {
      nextErrors.url =
        parsedUrl.error.issues[0]?.message ??
        "Use an http://, https://, or mailto: URL.";
    }
    setAddErrors(nextErrors);
    showMessage("");
    if (!parsedTitle.success || !parsedUrl.success) return;

    const previousLinks = links;
    const temporaryId = `optimistic-${Date.now()}`;
    const optimisticLink: Link = {
      id: temporaryId,
      profile_id: "",
      title: parsedTitle.data,
      url: parsedUrl.data,
      position: links.length,
      is_visible: true,
      thumbnail_url: null,
      starts_at: null,
      ends_at: null,
      created_at: new Date().toISOString(),
    };
    setLinks([...links, optimisticLink]);
    setIsSaving(true);
    try {
      const savedLink = await createOwnLink({
        title: parsedTitle.data,
        url: parsedUrl.data,
      });
      setLinks((current) =>
        current.map((link) => (link.id === temporaryId ? savedLink : link)),
      );
      setTitle("");
      setUrl("");
      showMessage("Link added.");
    } catch {
      setLinks(previousLinks);
      showMessage("We could not add this link. Your list was restored.", true);
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleVisibility(link: Link) {
    const previousLinks = links;
    const nextVisible = !link.is_visible;
    setLinks(
      links.map((item) =>
        item.id === link.id ? { ...item, is_visible: nextVisible } : item,
      ),
    );
    setIsSaving(true);
    showMessage("");
    try {
      const savedLink = await updateOwnLink(link.id, {
        is_visible: nextVisible,
      });
      setLinks((current) =>
        current.map((item) => (item.id === link.id ? savedLink : item)),
      );
      showMessage(nextVisible ? "Link is now shown." : "Link is now hidden.");
    } catch {
      setLinks(previousLinks);
      showMessage(
        "We could not update visibility. The previous value was restored.",
        true,
      );
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(link: Link) {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
    setEditErrors({});
    showMessage("");
  }

  async function saveEdit(link: Link) {
    const parsedTitle = linkTitleSchema.safeParse(editTitle);
    const parsedUrl = linkUrlSchema.safeParse(editUrl);
    const nextErrors: LinkErrors = {};
    if (!parsedTitle.success) {
      nextErrors.title =
        parsedTitle.error.issues[0]?.message ?? "Enter a link title.";
    }
    if (!parsedUrl.success) {
      nextErrors.url =
        parsedUrl.error.issues[0]?.message ??
        "Use an http://, https://, or mailto: URL.";
    }
    setEditErrors(nextErrors);
    if (!parsedTitle.success || !parsedUrl.success || isSaving) {
      return;
    }

    const previousLinks = links;
    const updatedLink = {
      ...link,
      title: parsedTitle.data,
      url: parsedUrl.data,
    };
    setLinks(links.map((item) => (item.id === link.id ? updatedLink : item)));
    setIsSaving(true);
    showMessage("");
    try {
      const savedLink = await updateOwnLink(link.id, {
        title: parsedTitle.data,
        url: parsedUrl.data,
      });
      setLinks((current) =>
        current.map((item) => (item.id === link.id ? savedLink : item)),
      );
      setEditingId(null);
      showMessage("Link updated.");
    } catch {
      setLinks(previousLinks);
      showMessage(
        "We could not save your edit. Your previous link was restored.",
        true,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveThumbnail(link: Link, file: File) {
    if (isSaving) return;
    const previousLinks = links;
    setIsSaving(true);
    showMessage("");
    try {
      const thumbnailUrl = await uploadOwnMedia(file);
      const savedLink = await updateOwnLink(link.id, {
        thumbnail_url: thumbnailUrl,
      });
      setLinks((current) =>
        current.map((item) => (item.id === link.id ? savedLink : item)),
      );
      showMessage("Link thumbnail saved.");
    } catch (error) {
      setLinks(previousLinks);
      showMessage(
        error instanceof Error
          ? error.message
          : "We could not save this thumbnail.",
        true,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeLink(link: Link) {
    if (isSaving || !window.confirm(`Delete "${link.title}"?`)) return;
    const previousLinks = links;
    setLinks(links.filter((item) => item.id !== link.id));
    setIsSaving(true);
    showMessage("");
    try {
      await deleteOwnLink(link.id);
      showMessage("Link deleted.");
    } catch {
      setLinks(previousLinks);
      showMessage(
        "We could not delete this link. Your list was restored.",
        true,
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="dashboard-section" aria-labelledby="links-heading">
      <div className="dashboard-section-heading">
        <div>
          <h2 id="links-heading">Your links</h2>
          <p>Arrange the links people should find on your page.</p>
        </div>
      </div>

      <form className="add-link-form" onSubmit={handleAdd} noValidate>
        <div className="dashboard-form-field">
          <label htmlFor="new-link-title">Title</label>
          <input
            className="input input-bordered"
            id="new-link-title"
            value={title}
            maxLength={100}
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={Boolean(addErrors.title)}
            aria-describedby={
              addErrors.title ? "new-link-title-error" : undefined
            }
          />
          {addErrors.title && (
            <p
              className="dashboard-error"
              id="new-link-title-error"
              role="alert"
            >
              {addErrors.title}
            </p>
          )}
        </div>
        <div className="dashboard-form-field">
          <label htmlFor="new-link-url">URL</label>
          <input
            className="input input-bordered"
            id="new-link-url"
            type="text"
            inputMode="url"
            placeholder="https://example.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            aria-invalid={Boolean(addErrors.url)}
            aria-describedby={addErrors.url ? "new-link-url-error" : undefined}
          />
          {addErrors.url && (
            <p className="dashboard-error" id="new-link-url-error" role="alert">
              {addErrors.url}
            </p>
          )}
        </div>
        <button className="btn btn-primary" type="submit" disabled={isSaving}>
          Add link
        </button>
      </form>

      {message && (
        <p
          className={writeFailed ? "dashboard-error" : "dashboard-status"}
          role={writeFailed ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      {links.length === 0 ? (
        <p className="dashboard-muted">
          Add a link to start building your page.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={links.map((link) => link.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="link-list" aria-label="Your links">
              {links.map((link, index) => (
                <SortableLinkRow
                  key={link.id}
                  link={link}
                  index={index}
                  count={links.length}
                  disabled={isSaving}
                  onMove={moveBy}
                  onToggle={(item) => void toggleVisibility(item)}
                  onDelete={(item) => void removeLink(item)}
                  editingId={editingId}
                  editTitle={editTitle}
                  editUrl={editUrl}
                  editErrors={editErrors}
                  onStartEdit={startEdit}
                  onCancelEdit={() => setEditingId(null)}
                  onEditTitleChange={setEditTitle}
                  onEditUrlChange={setEditUrl}
                  onSaveEdit={(item) => void saveEdit(item)}
                  onUploadThumbnail={(item, file) =>
                    void saveThumbnail(item, file)
                  }
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
