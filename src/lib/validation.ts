// Simple validation helpers - no heavy deps needed

import { CATEGORIES, type Category } from "./constants";

// Re-export for backwards compatibility
export const VALID_CATEGORIES = CATEGORIES;
export type { Category };

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov files
  "video/x-m4v",     // .m4v files
];

export const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

export type MediaType = "image" | "gif" | "video";

export function getMediaTypeFromUrl(url: string): MediaType {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.endsWith(".gif")) return "gif";
  if (lowercaseUrl.endsWith(".mp4") || lowercaseUrl.endsWith(".webm") || lowercaseUrl.endsWith(".mov") || lowercaseUrl.endsWith(".m4v")) return "video";
  return "image";
}

export function getMediaTypeFromMimeType(mimeType: string): MediaType {
  if (mimeType === "image/gif") return "gif";
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return "video";
  return "image";
}

export function isVideoUrl(url: string): boolean {
  return getMediaTypeFromUrl(url) === "video";
}

export function isGifUrl(url: string): boolean {
  return getMediaTypeFromUrl(url) === "gif";
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_TAG_LENGTH = 50;
export const MAX_TAGS_COUNT = 20;

type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validateMomentInput(data: Record<string, unknown>): ValidationResult {
  // Required fields
  if (!data.title || typeof data.title !== "string" || data.title.trim().length === 0) {
    return { valid: false, error: "Title is required" };
  }
  if (data.title.length > MAX_TITLE_LENGTH) {
    return { valid: false, error: `Title must be under ${MAX_TITLE_LENGTH} characters` };
  }

  if (!data.category || typeof data.category !== "string") {
    return { valid: false, error: "Category is required" };
  }
  if (!VALID_CATEGORIES.includes(data.category as Category)) {
    return { valid: false, error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` };
  }

  if (!data.description || typeof data.description !== "string" || data.description.trim().length === 0) {
    return { valid: false, error: "Description is required" };
  }
  if (data.description.length > MAX_DESCRIPTION_LENGTH) {
    return { valid: false, error: `Description must be under ${MAX_DESCRIPTION_LENGTH} characters` };
  }

  if (!data.imageUrl || typeof data.imageUrl !== "string") {
    return { valid: false, error: "Image URL is required" };
  }
  if (!isValidUrl(data.imageUrl)) {
    return { valid: false, error: "Invalid image URL format" };
  }

  // Optional fields
  if (data.creatorUrl && typeof data.creatorUrl === "string" && data.creatorUrl.length > 0) {
    if (!isValidUrl(data.creatorUrl)) {
      return { valid: false, error: "Invalid creator URL format" };
    }
  }

  if (data.sourceUrl && typeof data.sourceUrl === "string" && data.sourceUrl.length > 0) {
    if (!isValidUrl(data.sourceUrl)) {
      return { valid: false, error: "Invalid source URL format" };
    }
  }

  // Tags validation
  if (data.tags) {
    const tags = Array.isArray(data.tags)
      ? data.tags
      : typeof data.tags === "string"
        ? data.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];

    if (tags.length > MAX_TAGS_COUNT) {
      return { valid: false, error: `Maximum ${MAX_TAGS_COUNT} tags allowed` };
    }
    for (const tag of tags) {
      if (typeof tag !== "string" || tag.length > MAX_TAG_LENGTH) {
        return { valid: false, error: `Each tag must be under ${MAX_TAG_LENGTH} characters` };
      }
    }
  }

  return { valid: true };
}

export function validateFileUpload(file: File): ValidationResult {
  if (!file.type || !ALLOWED_MEDIA_TYPES.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: ${ALLOWED_MEDIA_TYPES.join(", ")}` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }
  return { valid: true };
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Sanitize filename for safe storage
export function sanitizeFilename(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mov", "m4v"].includes(ext) ? ext : "jpg";
  return `moment-${Date.now()}.${safeExt}`;
}

/**
 * Validates partial moment updates.
 * All fields are optional, but if provided they must be valid.
 * Slug changes are not allowed (returns error if slug is in payload).
 */
export function validateMomentUpdate(data: Record<string, unknown>): ValidationResult {
  // Reject slug changes
  if ("slug" in data) {
    return { valid: false, error: "Slug cannot be changed" };
  }

  // Check if at least one field is being updated
  const updateableFields = ["title", "category", "description", "imageUrl", "creatorName", "creatorUrl", "sourceUrl", "tags"];
  const hasUpdate = updateableFields.some(field => field in data);
  if (!hasUpdate) {
    return { valid: false, error: "No fields to update" };
  }

  // Validate title if provided
  if (data.title !== undefined) {
    if (typeof data.title !== "string" || data.title.trim().length === 0) {
      return { valid: false, error: "Title cannot be empty" };
    }
    if (data.title.length > MAX_TITLE_LENGTH) {
      return { valid: false, error: `Title must be under ${MAX_TITLE_LENGTH} characters` };
    }
  }

  // Validate category if provided
  if (data.category !== undefined) {
    if (typeof data.category !== "string") {
      return { valid: false, error: "Category must be a string" };
    }
    if (!VALID_CATEGORIES.includes(data.category as Category)) {
      return { valid: false, error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` };
    }
  }

  // Validate description if provided
  if (data.description !== undefined) {
    if (typeof data.description !== "string" || data.description.trim().length === 0) {
      return { valid: false, error: "Description cannot be empty" };
    }
    if (data.description.length > MAX_DESCRIPTION_LENGTH) {
      return { valid: false, error: `Description must be under ${MAX_DESCRIPTION_LENGTH} characters` };
    }
  }

  // Validate imageUrl if provided
  if (data.imageUrl !== undefined) {
    if (typeof data.imageUrl !== "string") {
      return { valid: false, error: "Image URL must be a string" };
    }
    if (!isValidUrl(data.imageUrl)) {
      return { valid: false, error: "Invalid image URL format" };
    }
  }

  // Validate creatorUrl if provided
  if (data.creatorUrl !== undefined && data.creatorUrl !== null) {
    if (typeof data.creatorUrl === "string" && data.creatorUrl.length > 0) {
      if (!isValidUrl(data.creatorUrl)) {
        return { valid: false, error: "Invalid creator URL format" };
      }
    }
  }

  // Validate sourceUrl if provided
  if (data.sourceUrl !== undefined) {
    if (typeof data.sourceUrl === "string" && data.sourceUrl.length > 0) {
      if (!isValidUrl(data.sourceUrl)) {
        return { valid: false, error: "Invalid source URL format" };
      }
    }
  }

  // Validate tags if provided
  if (data.tags !== undefined) {
    const tags = Array.isArray(data.tags)
      ? data.tags
      : typeof data.tags === "string"
        ? data.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];

    if (tags.length > MAX_TAGS_COUNT) {
      return { valid: false, error: `Maximum ${MAX_TAGS_COUNT} tags allowed` };
    }
    for (const tag of tags) {
      if (typeof tag !== "string" || tag.length > MAX_TAG_LENGTH) {
        return { valid: false, error: `Each tag must be under ${MAX_TAG_LENGTH} characters` };
      }
    }
  }

  return { valid: true };
}

/**
 * Validates visitor submission input.
 */
export function validateSubmissionInput(data: Record<string, unknown>): ValidationResult {
  // Required fields
  if (!data.imageUrl || typeof data.imageUrl !== "string") {
    return { valid: false, error: "Image is required" };
  }
  if (!isValidUrl(data.imageUrl)) {
    return { valid: false, error: "Invalid image URL format" };
  }

  if (!data.sourceUrl || typeof data.sourceUrl !== "string" || data.sourceUrl.trim().length === 0) {
    return { valid: false, error: "Source URL is required" };
  }
  if (!isValidUrl(data.sourceUrl)) {
    return { valid: false, error: "Invalid source URL format" };
  }

  if (!data.creatorName || typeof data.creatorName !== "string" || data.creatorName.trim().length === 0) {
    return { valid: false, error: "Creator name is required" };
  }
  if (data.creatorName.length > 200) {
    return { valid: false, error: "Creator name must be under 200 characters" };
  }

  // Optional fields
  if (data.creatorUrl !== undefined && data.creatorUrl !== null && data.creatorUrl !== "") {
    if (typeof data.creatorUrl !== "string" || !isValidUrl(data.creatorUrl)) {
      return { valid: false, error: "Invalid creator URL format" };
    }
  }

  if (data.title !== undefined && data.title !== null && data.title !== "") {
    if (typeof data.title !== "string") {
      return { valid: false, error: "Title must be a string" };
    }
    if (data.title.length > MAX_TITLE_LENGTH) {
      return { valid: false, error: `Title must be under ${MAX_TITLE_LENGTH} characters` };
    }
  }

  if (data.description !== undefined && data.description !== null && data.description !== "") {
    if (typeof data.description !== "string") {
      return { valid: false, error: "Description must be a string" };
    }
    if (data.description.length > MAX_DESCRIPTION_LENGTH) {
      return { valid: false, error: `Description must be under ${MAX_DESCRIPTION_LENGTH} characters` };
    }
  }

  if (data.submitterNote !== undefined && data.submitterNote !== null && data.submitterNote !== "") {
    if (typeof data.submitterNote !== "string") {
      return { valid: false, error: "Note must be a string" };
    }
    if (data.submitterNote.length > 1000) {
      return { valid: false, error: "Note must be under 1000 characters" };
    }
  }

  return { valid: true };
}
