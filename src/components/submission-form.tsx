"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  const [honeypot, setHoneypot] = useState(""); // Hidden field for bots

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showSuccessContent, setShowSuccessContent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [generalError, setGeneralError] = useState("");

  // Trigger success animation after state change
  useEffect(() => {
    if (submitSuccess) {
      // Small delay to allow form fade-out, then show success content
      const timer = setTimeout(() => setShowSuccessContent(true), 200);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

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

  // Success state with animation
  if (submitSuccess) {
    return (
      <div className="text-center py-16">
        <div
          className={`transition-all duration-300 ${
            showSuccessContent
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95"
          }`}
          style={{
            transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {/* Animated Checkmark */}
          <div className="flex justify-center mb-6">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              className="text-foreground"
            >
              <circle
                cx="24"
                cy="24"
                r="22"
                stroke="currentColor"
                strokeWidth="1.5"
                className={`${
                  showSuccessContent ? "animate-circle-draw" : ""
                }`}
                style={{
                  strokeDasharray: 138,
                  strokeDashoffset: showSuccessContent ? 0 : 138,
                  transition: "stroke-dashoffset 400ms ease-out",
                }}
              />
              <path
                d="M16 24L22 30L32 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 28,
                  strokeDashoffset: showSuccessContent ? 0 : 28,
                  transition: "stroke-dashoffset 250ms ease-out 200ms",
                }}
              />
            </svg>
          </div>

          {/* Title - staggers in after checkmark */}
          <h2
            className={`font-display text-sm font-medium mb-4 transition-all duration-300 ${
              showSuccessContent
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
            style={{
              transitionDelay: "150ms",
              transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            Thank You
          </h2>

          {/* Description - staggers in after title */}
          <p
            className={`font-body text-lg text-foreground-muted max-w-md mx-auto transition-all duration-300 ${
              showSuccessContent
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
            style={{
              transitionDelay: "250ms",
              transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            Your nomination has been received. We review submissions weekly. If selected,
            it will appear in the archive.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload */}
      <div ref={imageRef}>
        <label className="block font-display text-[11px] text-foreground-muted mb-2 text-center">
          Image *
        </label>
        {imageUrl ? (
          <div className="flex flex-col items-center">
            <div className="relative aspect-[3/4] w-full max-w-[240px] border border-border rounded-sm overflow-hidden">
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
              className="mt-3 font-display text-[11px] text-red-600 hover:text-red-800"
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
              aspect-[3/4] w-full max-w-[240px] mx-auto border-2 border-dashed rounded-sm flex items-center justify-center cursor-pointer
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
          <p className="mt-2 font-body text-[12px] text-red-600 text-center" role="alert">
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
