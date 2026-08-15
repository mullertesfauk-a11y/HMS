/** URL-safe slug from a display name, e.g. "Deluxe Room" → "deluxe-room". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
