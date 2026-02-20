/**
 * Generate a URL-friendly slug from a title.
 * Used by both admin page and API.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Format a year for display.
 * - year=2024, approximate=false → "2024"
 * - year=1990, approximate=true → "1990s"
 * - year=null → null
 */
export function formatYear(year: number | null, approximate: boolean): string | null {
  if (year === null) return null;
  if (approximate) return `${year}s`;
  return String(year);
}
