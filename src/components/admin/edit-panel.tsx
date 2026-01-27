"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { CATEGORIES, TAG_SUGGESTIONS, isCategory } from "@/lib/constants";
import type { Moment } from "@/lib/moments";
import { isVideoUrl, isGifUrl } from "@/lib/validation";

type EditPanelProps = {
  moment: Moment;
  adminPassword: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedMoment: Moment) => void;
};

export function EditPanel({
  moment,
  adminPassword,
  isOpen,
  onClose,
  onSave,
}: EditPanelProps) {
  // Form state initialized from moment
  const [title, setTitle] = useState(moment.title);
  const [category, setCategory] = useState(moment.category);
  const [creatorName, setCreatorName] = useState(moment.creatorName || "");
  const [creatorUrl, setCreatorUrl] = useState(moment.creatorUrl || "");
  const [sourceUrl, setSourceUrl] = useState(moment.sourceUrl);
  const [imageUrl, setImageUrl] = useState(moment.imageUrl || "");
  const [description, setDescription] = useState(moment.description);
  const [tags, setTags] = useState<string[]>(moment.tags);
  const [tagInput, setTagInput] = useState("");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Refs for focus management
  const panelRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Reset form when moment changes or panel opens
  useEffect(() => {
    if (isOpen) {
      setTitle(moment.title);
      setCategory(moment.category);
      setCreatorName(moment.creatorName || "");
      setCreatorUrl(moment.creatorUrl || "");
      setSourceUrl(moment.sourceUrl);
      setImageUrl(moment.imageUrl || "");
      setDescription(moment.description);
      setTags(moment.tags);
      setTagInput("");
      setSubmitError("");
      setSubmitSuccess(false);

      // Focus first input after panel opens
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, moment]);

  // Handle Escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === "s" && isOpen) {
        e.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Trap focus within panel when open
  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusableElements = panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    panel.addEventListener("keydown", handleTabKey);
    return () => panel.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      await uploadFile(file);
    }
  }, [adminPassword]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-admin-password": adminPassword,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setImageUrl(data.url);
    } catch (error) {
      console.error("Upload error:", error);
      setSubmitError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTagSuggestionClick = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitSuccess(false);

    // Validate required fields
    if (!title || !category || !description || !imageUrl) {
      setSubmitError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/moments/${moment.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({
          title,
          category,
          creatorName: creatorName || null,
          creatorUrl: creatorUrl || null,
          sourceUrl: sourceUrl || null,
          imageUrl,
          description,
          tags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update moment");
      }

      setSubmitSuccess(true);

      // Announce to screen readers
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.className = "sr-only";
      announcement.textContent = "Changes saved successfully";
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);

      // Call onSave with updated moment and close panel after brief delay
      setTimeout(() => {
        onSave(data.moment);
        onClose();
      }, 500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to update moment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Edit moment"
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white border-l border-border z-50 overflow-y-auto shadow-xl transform transition-transform"
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Panel Header */}
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display text-[12px] font-semibold uppercase">
            Edit Moment
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              ref={closeButtonRef}
              className="font-display text-[11px] text-foreground-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 font-display text-[11px] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Media Upload (Hero Action) */}
          <div>
            <label className="block font-display text-[11px] text-foreground-muted mb-2">
              Media *
            </label>
            {imageUrl ? (
              <div className="relative">
                <div className="relative aspect-[3/4] max-w-full border border-border rounded-sm overflow-hidden">
                  {isVideoUrl(imageUrl) ? (
                    <video
                      src={imageUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized={isGifUrl(imageUrl)}
                    />
                  )}
                  {/* Overlay for replacing */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      absolute inset-0 flex items-center justify-center cursor-pointer
                      transition-opacity
                      ${isDragging ? "bg-black/50 opacity-100" : "bg-black/0 opacity-0 hover:bg-black/30 hover:opacity-100"}
                    `}
                  >
                    <span className="font-display text-[11px] text-white uppercase bg-black/70 px-3 py-2 rounded-sm">
                      {isUploading ? "Uploading..." : "Replace Media"}
                    </span>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="mt-2 font-display text-[11px] text-red-600 hover:text-red-800"
                >
                  Remove Media
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  aspect-[3/4] border-2 border-dashed rounded-sm flex items-center justify-center cursor-pointer
                  transition-colors
                  ${isDragging ? "border-foreground bg-gray-50" : "border-border hover:border-foreground/50"}
                  ${isUploading ? "opacity-50 pointer-events-none" : ""}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="font-body text-[13px] text-foreground-muted text-center px-4">
                  {isUploading ? "Uploading..." : "Drop image, GIF, or video here"}
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="edit-title" className="block font-display text-[11px] text-foreground-muted mb-2">
              Title *
            </label>
            <input
              ref={firstInputRef}
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="edit-category" className="block font-display text-[11px] text-foreground-muted mb-2">
              Category *
            </label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-description" className="block font-display text-[11px] text-foreground-muted mb-2">
              Description *
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white resize-y"
            />
          </div>

          {/* Creator Name */}
          <div>
            <label htmlFor="edit-creator-name" className="block font-display text-[11px] text-foreground-muted mb-2">
              Creator Name
            </label>
            <input
              id="edit-creator-name"
              type="text"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
            />
          </div>

          {/* Creator URL */}
          <div>
            <label htmlFor="edit-creator-url" className="block font-display text-[11px] text-foreground-muted mb-2">
              Creator URL
            </label>
            <input
              id="edit-creator-url"
              type="url"
              value={creatorUrl}
              onChange={(e) => setCreatorUrl(e.target.value)}
              className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
            />
          </div>

          {/* Source URL */}
          <div>
            <label htmlFor="edit-source-url" className="block font-display text-[11px] text-foreground-muted mb-2">
              Source URL
            </label>
            <input
              id="edit-source-url"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="edit-tags" className="block font-display text-[11px] text-foreground-muted mb-2">
              Tags
            </label>

            {/* Tag suggestions */}
            {isCategory(category) && (
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="font-display text-[10px] text-foreground-muted">
                  Suggestions:
                </span>
                {TAG_SUGGESTIONS[category].map((tag: string) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagSuggestionClick(tag)}
                    className={`
                      px-2 py-1 font-display text-[10px] border rounded-sm transition-colors
                      ${tags.includes(tag)
                        ? "bg-foreground text-background border-foreground"
                        : "border-border hover:border-foreground"}
                    `}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Selected tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-foreground text-background font-display text-[10px] rounded-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-300"
                      aria-label={`Remove ${tag} tag`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              id="edit-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
              placeholder="Type and press Enter to add tags"
            />
          </div>

          {/* Error */}
          {submitError && (
            <p className="font-body text-[13px] text-red-600" role="alert">
              {submitError}
            </p>
          )}

          {/* Success */}
          {submitSuccess && (
            <p className="font-body text-[13px] text-green-600" role="status">
              Changes saved successfully!
            </p>
          )}
        </div>
      </div>
    </>
  );
}
