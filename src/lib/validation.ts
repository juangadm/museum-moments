// Simple validation helpers - no heavy deps needed

export const VALID_CATEGORIES = [
  "Branding",
  "Images",
  "Interfaces",
  "Objects",
  "Spaces",
  "Typography",
] as const;

export type Category = (typeof VALID_CATEGORIES)[number];

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

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
  if (!file.type || !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}` };
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
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  return `moment-${Date.now()}.${safeExt}`;
}
