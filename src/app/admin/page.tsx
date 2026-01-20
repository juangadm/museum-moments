"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, CATEGORY_DESCRIPTIONS, TAG_SUGGESTIONS, isCategory } from "@/lib/constants";
import { generateSlug } from "@/lib/utils";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showCategoryGuide, setShowCategoryGuide] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorUrl, setCreatorUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");

  // Check localStorage for saved password on mount
  useEffect(() => {
    const savedPassword = localStorage.getItem("admin-password");
    if (savedPassword) {
      setPassword(savedPassword);
      setIsAuthenticated(true);
    }
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !slugEdited) {
      setSlug(generateSlug(title));
    }
  }, [title, slugEdited]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    // Verify password against API
    try {
      const response = await fetch("/api/moments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ test: true }),
      });

      if (response.status === 401) {
        setAuthError("Incorrect password");
        return;
      }

      // Password is correct (even though the request will fail for other reasons)
      localStorage.setItem("admin-password", password);
      setIsAuthenticated(true);
    } catch {
      // If we can't reach the API, still allow local testing
      localStorage.setItem("admin-password", password);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-password");
    setIsAuthenticated(false);
    setPassword("");
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      await uploadFile(file);
    }
  }, []);

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
          "x-admin-password": password,
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
      alert("Failed to upload image. Please try again.");
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

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setSlugEdited(false);
    setCategory("");
    setCreatorName("");
    setCreatorUrl("");
    setSourceUrl("");
    setImageUrl("");
    setDescription("");
    setTags([]);
    setTagInput("");
    setSubmitSuccess(null);
    setSubmitError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(null);

    // Validate required fields
    if (!title || !category || !description || !imageUrl) {
      setSubmitError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/moments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          title,
          slug,
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
        throw new Error(data.error || "Failed to create moment");
      }

      setSubmitSuccess(data.moment.slug);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create moment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-logo text-2xl uppercase tracking-tight">Museum Moments</h1>
            <p className="font-display text-[11px] text-foreground-muted mt-2">ADMIN</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground"
                autoFocus
              />
            </div>
            {authError && (
              <p className="font-body text-[12px] text-red-600">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 font-display text-[12px] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin form
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-logo text-xl uppercase tracking-tight">
              Museum Moments
            </Link>
            <span className="font-display text-[11px] text-foreground-muted">/ ADMIN /</span>
            <span className="font-display text-[11px] font-medium">ADD</span>
            <span className="font-display text-[11px] text-foreground-muted">/</span>
            <Link href="/admin/submissions" className="font-display text-[11px] text-foreground-muted hover:text-foreground">
              SUBMISSIONS
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="font-display text-[11px] text-foreground-muted hover:text-foreground"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Category Guide */}
        <div className="mb-8">
          <button
            onClick={() => setShowCategoryGuide(!showCategoryGuide)}
            className="font-display text-[11px] text-foreground-muted hover:text-foreground flex items-center gap-2"
          >
            CATEGORY GUIDE
            <span>{showCategoryGuide ? "[-]" : "[+]"}</span>
          </button>

          {showCategoryGuide && (
            <div className="mt-3 p-4 bg-white border border-border rounded-sm">
              <div className="grid gap-2">
                {CATEGORIES.map((cat) => (
                  <div key={cat} className="flex">
                    <span className="font-display text-[11px] w-24">{cat}</span>
                    <span className="font-body text-[12px] text-foreground-muted">
                      {CATEGORY_DESCRIPTIONS[cat]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="font-display text-[12px] font-semibold border-b border-border pb-2">
            ADD NEW MOMENT
          </h2>

          {/* Title */}
          <div>
            <label className="block font-display text-[11px] text-foreground-muted mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
              placeholder="Linear 2024 Release Page"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block font-display text-[11px] text-foreground-muted mb-2">
              Slug (auto-generated)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugEdited(true);
              }}
              className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
              placeholder="linear-2024-release-page"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-display text-[11px] text-foreground-muted mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Creator Name */}
          <div>
            <label className="block font-display text-[11px] text-foreground-muted mb-2">
              Creator Name
            </label>
            <input
              type="text"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
              placeholder="Linear"
            />
          </div>

          {/* Creator URL */}
          <div>
            <label className="block font-display text-[11px] text-foreground-muted mb-2">
              Creator URL
            </label>
            <input
              type="url"
              value={creatorUrl}
              onChange={(e) => setCreatorUrl(e.target.value)}
              className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
              placeholder="https://linear.app"
            />
          </div>

          {/* Source URL */}
          <div>
            <label className="block font-display text-[11px] text-foreground-muted mb-2">
              Source URL
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
              placeholder="https://linear.app/releases/2024-01"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block font-display text-[11px] text-foreground-muted mb-2">
              Image *
            </label>
            {imageUrl ? (
              <div className="relative">
                <div className="relative aspect-[3/4] max-w-[200px] border border-border rounded-sm overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="mt-2 font-display text-[11px] text-red-600 hover:text-red-800"
                >
                  Remove
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
                  border-2 border-dashed rounded-sm p-8 text-center cursor-pointer
                  transition-colors
                  ${isDragging ? "border-foreground bg-gray-50" : "border-border hover:border-foreground/50"}
                  ${isUploading ? "opacity-50 pointer-events-none" : ""}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="font-body text-[13px] text-foreground-muted">
                  {isUploading ? "Uploading..." : "Drop image here or click to upload"}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block font-display text-[11px] text-foreground-muted mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white resize-y"
              placeholder="Linear's release pages are a masterclass in restraint..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block font-display text-[11px] text-foreground-muted mb-2">
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
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
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
            <p className="font-body text-[13px] text-red-600">{submitError}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 font-display text-[12px] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Moment"}
          </button>

          {/* Success message */}
          {submitSuccess && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-sm">
              <p className="font-body text-[13px] text-green-800">
                Moment saved!{" "}
                <Link
                  href={`/m/${submitSuccess}`}
                  className="underline hover:no-underline"
                  target="_blank"
                >
                  View it &rarr;
                </Link>
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-2 font-display text-[11px] text-green-700 hover:text-green-900"
              >
                Add another
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
