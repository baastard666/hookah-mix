export function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9а-яё]+/giu, "-").replace(/^-+|-+$/g, "");
}
