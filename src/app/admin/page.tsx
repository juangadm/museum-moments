"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, CATEGORY_DESCRIPTIONS, TAG_SUGGESTIONS, isCategory } from "@/lib/constants";
import { generateSlug } from "@/lib/utils";
import { isVideoUrl, isGifUrl } from "@/lib/validation";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showCategoryGuide, setShowCategoryGuide] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [yearApproximate, setYearApproximate] = useState(false);
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

  // URL pre-fill state
  const [prefillUrl, setPrefillUrl] = useState("");
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [prefillError, setPrefillError] = useState("");
  const [extractedImages, setExtractedImages] = useState<string[]>([]);

  // Tag generation state
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

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
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
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
    setYear("");
    setYearApproximate(false);
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
    setPrefillUrl("");
    setPrefillError("");
    setExtractedImages([]);
    setSuggestedTags([]);
  };

  const handlePrefillFromUrl = async () => {
    if (!prefillUrl.trim()) return;

    setIsPrefilling(true);
    setPrefillError("");
    setExtractedImages([]);

    try {
      const response = await fetch("/api/scrape-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ url: prefillUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch URL");
      }

      // Pre-fill form fields
      if (data.title && !title) {
        setTitle(data.title);
      }
      if (data.creator && !creatorName) {
        setCreatorName(data.creator);
      }
      if (data.sourceUrl && !sourceUrl) {
        setSourceUrl(data.sourceUrl);
      }
      // Auto-select category if suggested and valid
      if (data.category && !category && isCategory(data.category)) {
        setCategory(data.category);
      }
      if (data.year && !year) {
        setYear(String(data.year));
      }
      if (data.yearApproximate !== undefined) {
        setYearApproximate(data.yearApproximate);
      }
      // Store extracted images for selection
      if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        setExtractedImages(data.images);
      }
    } catch (error) {
      setPrefillError(error instanceof Error ? error.message : "Failed to fetch URL");
    } finally {
      setIsPrefilling(false);
    }
  };

  const handleSelectExtractedImage = async (imageUrl: string) => {
    // Download the image and upload it to Vercel Blob
    setIsUploading(true);
    try {
      // Fetch the image
      const response = await fetch("/api/proxy-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ url: imageUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }

      const data = await response.json();
      setImageUrl(data.url);
      setExtractedImages([]); // Clear extracted images after selection
    } catch (error) {
      console.error("Failed to use extracted image:", error);
      alert("Failed to use this image. Please try uploading manually.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateTags = async () => {
    if (!description.trim()) return;

    setIsGeneratingTags(true);
    setSuggestedTags([]);

    try {
      const response = await fetch("/api/generate-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ title, description, category }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate tags");
      }

      // Filter out tags that are already selected
      const newSuggestions = data.tags.filter((tag: string) => !tags.includes(tag));
      setSuggestedTags(newSuggestions);
    } catch (error) {
      console.error("Generate tags error:", error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleSuggestedTagClick = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setSuggestedTags(suggestedTags.filter((t) => t !== tag));
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
          year: year ? parseInt(year, 10) : null,
          yearApproximate,
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

          {/* URL Pre-fill */}
          <div className="p-4 bg-white border border-dashed border-border rounded-sm">
            <label className="block font-display text-[11px] text-foreground-muted mb-2">
              Quick fill from URL (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={prefillUrl}
                onChange={(e) => setPrefillUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handlePrefillFromUrl();
                  }
                }}
                className="flex-1 px-4 py-2 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
                placeholder="Paste a URL to auto-fill title, creator, source..."
              />
              <button
                type="button"
                onClick={handlePrefillFromUrl}
                disabled={isPrefilling || !prefillUrl.trim()}
                className="px-4 py-2 font-display text-[11px] uppercase border border-border hover:border-foreground transition-colors disabled:opacity-50"
              >
                {isPrefilling ? "Loading..." : "Fetch"}
              </button>
            </div>
            {prefillError && (
              <p className="mt-2 font-body text-[12px] text-red-600">{prefillError}</p>
            )}
          </div>

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

          {/* Year */}
          <div>
            <label className="block font-display text-[11px] text-foreground-muted mb-2">
              Year Created
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-32 px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
                placeholder="2024"
                min="1000"
                max={new Date().getFullYear() + 1}
              />
              <label className="flex items-center gap-2 font-body text-[13px] text-foreground-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={yearApproximate}
                  onChange={(e) => setYearApproximate(e.target.checked)}
                  className="rounded-sm"
                />
                Approximate (decade)
              </label>
            </div>
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
              <div className="space-y-4">
                {/* Extracted images from URL */}
                {extractedImages.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-sm">
                    <p className="font-display text-[10px] text-blue-700 mb-3">
                      EXTRACTED IMAGES (click to use):
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {extractedImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectExtractedImage(img)}
                          disabled={isUploading}
                          className="relative w-24 h-32 border-2 border-blue-300 hover:border-blue-500 rounded-sm overflow-hidden transition-colors disabled:opacity-50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={`Extracted ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Hide broken images
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drop zone for manual upload */}
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
                    accept="image/*,video/mp4,video/webm,video/quicktime,video/x-m4v"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="font-body text-[13px] text-foreground-muted">
                    {isUploading ? "Uploading..." : extractedImages.length > 0 ? "Or drop your own image here" : "Drop image, GIF, or video here or click to upload"}
                  </p>
                </div>
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
            <div className="flex items-center justify-between mb-2">
              <label className="font-display text-[11px] text-foreground-muted">
                Tags
              </label>
              <button
                type="button"
                onClick={handleGenerateTags}
                disabled={isGeneratingTags || !description.trim()}
                className="px-3 py-1 font-display text-[10px] uppercase border border-border hover:border-foreground transition-colors disabled:opacity-50 rounded-sm"
              >
                {isGeneratingTags ? "Generating..." : "Generate from description"}
              </button>
            </div>

            {/* AI-generated tag suggestions */}
            {suggestedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-sm">
                <span className="font-display text-[10px] text-blue-700 w-full mb-1">
                  AI suggestions (click to add):
                </span>
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleSuggestedTagClick(tag)}
                    className="px-2 py-1 font-display text-[10px] border border-blue-300 text-blue-800 hover:bg-blue-100 rounded-sm transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Category-based tag suggestions */}
            {isCategory(category) && (
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="font-display text-[10px] text-foreground-muted">
                  Category suggestions:
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
