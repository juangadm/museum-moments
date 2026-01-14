import { describe, it, expect } from "vitest";
import {
  validateMomentInput,
  validateFileUpload,
  sanitizeFilename,
  VALID_CATEGORIES,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_FILE_SIZE,
} from "./validation";

describe("validateMomentInput", () => {
  const validInput = {
    title: "Test Moment",
    category: "Branding",
    description: "A test description",
    imageUrl: "https://example.com/image.jpg",
  };

  it("accepts valid input", () => {
    expect(validateMomentInput(validInput)).toEqual({ valid: true });
  });

  it("requires title", () => {
    const input = { ...validInput, title: undefined };
    const result = validateMomentInput(input);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("Title");
    }
  });

  it("requires non-empty title", () => {
    const input = { ...validInput, title: "   " };
    const result = validateMomentInput(input);
    expect(result.valid).toBe(false);
  });

  it("rejects title over max length", () => {
    const input = { ...validInput, title: "a".repeat(MAX_TITLE_LENGTH + 1) };
    const result = validateMomentInput(input);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("Title");
    }
  });

  it("requires valid category", () => {
    const input = { ...validInput, category: "InvalidCategory" };
    const result = validateMomentInput(input);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("category");
    }
  });

  it("accepts all valid categories", () => {
    for (const category of VALID_CATEGORIES) {
      const input = { ...validInput, category };
      expect(validateMomentInput(input)).toEqual({ valid: true });
    }
  });

  it("requires description", () => {
    const input = { ...validInput, description: undefined };
    const result = validateMomentInput(input);
    expect(result.valid).toBe(false);
  });

  it("rejects description over max length", () => {
    const input = { ...validInput, description: "a".repeat(MAX_DESCRIPTION_LENGTH + 1) };
    const result = validateMomentInput(input);
    expect(result.valid).toBe(false);
  });

  it("requires valid imageUrl", () => {
    const input = { ...validInput, imageUrl: "not-a-url" };
    const result = validateMomentInput(input);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("URL");
    }
  });

  it("accepts http and https URLs", () => {
    expect(validateMomentInput({ ...validInput, imageUrl: "http://example.com/img.jpg" })).toEqual({ valid: true });
    expect(validateMomentInput({ ...validInput, imageUrl: "https://example.com/img.jpg" })).toEqual({ valid: true });
  });

  it("validates optional creatorUrl format", () => {
    const input = { ...validInput, creatorUrl: "not-a-url" };
    const result = validateMomentInput(input);
    expect(result.valid).toBe(false);
  });

  it("accepts empty creatorUrl", () => {
    const input = { ...validInput, creatorUrl: "" };
    expect(validateMomentInput(input)).toEqual({ valid: true });
  });

  it("validates optional sourceUrl format", () => {
    const input = { ...validInput, sourceUrl: "invalid" };
    const result = validateMomentInput(input);
    expect(result.valid).toBe(false);
  });

  it("limits number of tags", () => {
    const input = { ...validInput, tags: Array(21).fill("tag") };
    const result = validateMomentInput(input);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("tag");
    }
  });

  it("limits tag length", () => {
    const input = { ...validInput, tags: ["a".repeat(51)] };
    const result = validateMomentInput(input);
    expect(result.valid).toBe(false);
  });

  it("accepts tags as comma-separated string", () => {
    const input = { ...validInput, tags: "tag1, tag2, tag3" };
    expect(validateMomentInput(input)).toEqual({ valid: true });
  });
});

describe("validateFileUpload", () => {
  const createMockFile = (type: string, size: number): File => {
    return {
      type,
      size,
      name: "test.jpg",
    } as File;
  };

  it("accepts valid image types", () => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    for (const type of validTypes) {
      const file = createMockFile(type, 1024);
      expect(validateFileUpload(file)).toEqual({ valid: true });
    }
  });

  it("rejects invalid file types", () => {
    const file = createMockFile("application/pdf", 1024);
    const result = validateFileUpload(file);
    expect(result.valid).toBe(false);
  });

  it("rejects files over size limit", () => {
    const file = createMockFile("image/jpeg", MAX_FILE_SIZE + 1);
    const result = validateFileUpload(file);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("large");
    }
  });
});

describe("sanitizeFilename", () => {
  it("creates safe filename with timestamp", () => {
    const result = sanitizeFilename("my photo.jpg");
    expect(result).toMatch(/^moment-\d+\.jpg$/);
  });

  it("normalizes extension to lowercase", () => {
    const result = sanitizeFilename("photo.PNG");
    expect(result).toMatch(/\.png$/);
  });

  it("defaults to jpg for unknown extensions", () => {
    const result = sanitizeFilename("file.exe");
    expect(result).toMatch(/\.jpg$/);
  });

  it("handles files without extension", () => {
    const result = sanitizeFilename("noextension");
    expect(result).toMatch(/\.jpg$/);
  });
});
