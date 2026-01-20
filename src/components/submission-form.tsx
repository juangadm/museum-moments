"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";

type FieldError = {
  field: string;
  message: string;
};

export function SubmissionForm() {
  // Form state
  const [imageUrl, setImageUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorUrl, setCreatorUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitterNote, setSubmitterNote] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Hidden field for bots

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [generalError, setGeneralError] = useState("");

  // Refs for focus management
  const imageRef = useRef<HTMLDivElement>(null);
  const sourceUrlRef = useRef<HTMLInputElement>(null);
  const creatorNameRef = useRef<HTMLInputElement>(null);

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
    setFieldErrors((prev) => prev.filter((e) => e.field !== "imageUrl"));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/public", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setGeneralError(data.error || "Too many uploads. Please try again later.");
        } else {
          setFieldErrors([{ field: "imageUrl", message: data.error || "Upload failed" }]);
        }
        return;
      }

      setImageUrl(data.url);
    } catch (error) {
      console.error("Upload error:", error);
      setFieldErrors([{ field: "imageUrl", message: "Failed to upload image. Please try again." }]);
    } finally {
      setIsUploading(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return fieldErrors.find((e) => e.field === field)?.message;
  };

  const focusFirstError = () => {
    if (fieldErrors.length === 0) return;

    const firstError = fieldErrors[0];
    switch (firstError.field) {
      case "imageUrl":
        imageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        fileInputRef.current?.focus();
        break;
      case "sourceUrl":
        sourceUrlRef.current?.focus();
        sourceUrlRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      case "creatorName":
        creatorNameRef.current?.focus();
        creatorNameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors([]);
    setGeneralError("");

    // Client-side validation
    const errors: FieldError[] = [];

    if (!imageUrl) {
      errors.push({ field: "imageUrl", message: "Image is required" });
    }
    if (!sourceUrl.trim()) {
      errors.push({ field: "sourceUrl", message: "Source URL is required" });
    } else {
      try {
        new URL(sourceUrl);
      } catch {
        errors.push({ field: "sourceUrl", message: "Please enter a valid URL" });
      }
    }
    if (!creatorName.trim()) {
      errors.push({ field: "creatorName", message: "Creator name is required" });
    }
    if (creatorUrl.trim()) {
      try {
        new URL(creatorUrl);
      } catch {
        errors.push({ field: "creatorUrl", message: "Please enter a valid URL" });
      }
    }

    if (errors.length > 0) {
      setFieldErrors(errors);
      setTimeout(focusFirstError, 100);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          sourceUrl: sourceUrl.trim(),
          creatorName: creatorName.trim(),
          creatorUrl: creatorUrl.trim() || null,
          title: title.trim() || null,
          description: description.trim() || null,
          submitterNote: submitterNote.trim() || null,
          honeypot, // Will be empty for humans
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setGeneralError(data.error || "Too many submissions. Please try again later.");
        } else {
          setGeneralError(data.error || "Failed to submit. Please try again.");
        }
        return;
      }

      setSubmitSuccess(true);
    } catch (error) {
      console.error("Submit error:", error);
      setGeneralError("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (submitSuccess) {
    return (
      <div className="text-center py-16">
        <h2 className="font-display text-sm font-medium mb-4">Thank You</h2>
        <p className="font-body text-lg text-foreground-muted max-w-md mx-auto">
          Your nomination has been received. We review submissions weekly. If selected,
          it will appear in the archive.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload */}
      <div ref={imageRef}>
        <label className="block font-display text-[11px] text-foreground-muted mb-2">
          Image *
        </label>
        {imageUrl ? (
          <div className="relative">
            <div className="relative aspect-[3/4] max-w-[300px] border border-border rounded-sm overflow-hidden">
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
              aspect-[3/4] max-w-[300px] border-2 border-dashed rounded-sm flex items-center justify-center cursor-pointer
              transition-colors
              ${isDragging ? "border-foreground bg-gray-50" : "border-border hover:border-foreground/50"}
              ${isUploading ? "opacity-50 pointer-events-none" : ""}
              ${getFieldError("imageUrl") ? "border-red-400" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="font-body text-[13px] text-foreground-muted text-center px-4">
              {isUploading ? "Uploading..." : "Drop image here or click to upload"}
            </p>
          </div>
        )}
        {getFieldError("imageUrl") && (
          <p className="mt-2 font-body text-[12px] text-red-600" role="alert">
            {getFieldError("imageUrl")}
          </p>
        )}
      </div>

      {/* Source URL */}
      <div>
        <label htmlFor="sourceUrl" className="block font-display text-[11px] text-foreground-muted mb-2">
          Source URL *
        </label>
        <input
          ref={sourceUrlRef}
          id="sourceUrl"
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          className={`w-full px-4 py-3 font-body text-[13px] border rounded-sm focus:outline-none focus:border-foreground bg-white ${
            getFieldError("sourceUrl") ? "border-red-400" : "border-border"
          }`}
          placeholder="https://example.com/the-design"
        />
        {getFieldError("sourceUrl") && (
          <p className="mt-1 font-body text-[12px] text-red-600" role="alert">
            {getFieldError("sourceUrl")}
          </p>
        )}
      </div>

      {/* Creator Name */}
      <div>
        <label htmlFor="creatorName" className="block font-display text-[11px] text-foreground-muted mb-2">
          Creator Name *
        </label>
        <input
          ref={creatorNameRef}
          id="creatorName"
          type="text"
          value={creatorName}
          onChange={(e) => setCreatorName(e.target.value)}
          className={`w-full px-4 py-3 font-body text-[13px] border rounded-sm focus:outline-none focus:border-foreground bg-white ${
            getFieldError("creatorName") ? "border-red-400" : "border-border"
          }`}
          placeholder="Studio Name or Designer"
        />
        {getFieldError("creatorName") && (
          <p className="mt-1 font-body text-[12px] text-red-600" role="alert">
            {getFieldError("creatorName")}
          </p>
        )}
      </div>

      {/* Creator URL (optional) */}
      <div>
        <label htmlFor="creatorUrl" className="block font-display text-[11px] text-foreground-muted mb-2">
          Creator URL
        </label>
        <input
          id="creatorUrl"
          type="url"
          value={creatorUrl}
          onChange={(e) => setCreatorUrl(e.target.value)}
          className={`w-full px-4 py-3 font-body text-[13px] border rounded-sm focus:outline-none focus:border-foreground bg-white ${
            getFieldError("creatorUrl") ? "border-red-400" : "border-border"
          }`}
          placeholder="https://creator-website.com"
        />
        {getFieldError("creatorUrl") && (
          <p className="mt-1 font-body text-[12px] text-red-600" role="alert">
            {getFieldError("creatorUrl")}
          </p>
        )}
      </div>

      {/* Suggested Title (optional) */}
      <div>
        <label htmlFor="title" className="block font-display text-[11px] text-foreground-muted mb-2">
          Suggested Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
          placeholder="Optional - we'll name it if blank"
        />
      </div>

      {/* Why noteworthy (optional) */}
      <div>
        <label htmlFor="description" className="block font-display text-[11px] text-foreground-muted mb-2">
          Why is this noteworthy?
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white resize-y"
          placeholder="Tell us what makes this special... (optional)"
        />
        <p className="mt-1 font-body text-[11px] text-foreground-muted">
          Optional - we write the editorial description
        </p>
      </div>

      {/* Note to Curator (optional) */}
      <div>
        <label htmlFor="submitterNote" className="block font-display text-[11px] text-foreground-muted mb-2">
          Note to Curator
        </label>
        <textarea
          id="submitterNote"
          value={submitterNote}
          onChange={(e) => setSubmitterNote(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white resize-y"
          placeholder="How you found it, context, etc..."
        />
      </div>

      {/* Honeypot - hidden from humans */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          height: 0,
          overflow: "hidden",
        }}
      >
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {/* General Error */}
      {generalError && (
        <p className="font-body text-[13px] text-red-600" role="alert">
          {generalError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || isUploading}
        className="w-full py-4 font-display text-[12px] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit for Review"}
      </button>
    </form>
  );
}
