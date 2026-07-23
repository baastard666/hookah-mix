import { FLAVOR_NOTE_CATEGORIES, FLAVOR_NOTE_TYPES, FLAVOR_PROFILE_CORE_FIELDS, FLAVOR_PROFILE_SECONDARY_FIELDS, PROFILE_SOURCES, PROFILE_STATUSES, type FlavorProfileInput } from "./types";
import { normalizeSlug } from "./slug";

export type FlavorValidationResult = { success: boolean; errors: string[]; normalizedValue?: FlavorProfileInput };

export function validateFlavor(value: FlavorProfileInput): FlavorValidationResult {
  const errors: string[] = [];
  const name = value.name.trim();
  const slug = normalizeSlug(value.slug);
  if (!name) errors.push("Flavor name не должен быть пустым");
  if (!value.slug.trim()) errors.push("Flavor slug не должен быть пустым");
  else if (value.slug !== slug) errors.push("Flavor slug должен быть нормализован");
  for (const field of FLAVOR_PROFILE_CORE_FIELDS) if (!Number.isFinite(value[field]) || value[field] < 0 || value[field] > 10) errors.push(`${field} должен быть числом от 0 до 10`);
  // ADR-015: null is a legitimate "not measured" state for secondary fields, distinct from an invalid value - only reject non-null values outside the valid range.
  for (const field of FLAVOR_PROFILE_SECONDARY_FIELDS) { const secondaryValue = value[field]; if (secondaryValue !== null && (!Number.isFinite(secondaryValue) || secondaryValue < 0 || secondaryValue > 10)) errors.push(`${field} должен быть null или числом от 0 до 10`); }
  if (!PROFILE_STATUSES.includes(value.profileStatus as typeof PROFILE_STATUSES[number])) errors.push("Некорректный profileStatus");
  if (!PROFILE_SOURCES.includes(value.profileSource as typeof PROFILE_SOURCES[number])) errors.push("Некорректный profileSource");
  if (!value.notes.some(note => note.noteType === "DOMINANT")) errors.push("Flavor должен иметь минимум одну DOMINANT-ноту");
  const noteSlugs = new Set<string>();
  for (const assignment of value.notes) {
    const noteSlug = normalizeSlug(assignment.note.slug);
    if (!assignment.note.name.trim()) errors.push("FlavorNote name не должен быть пустым");
    if (!assignment.note.slug.trim()) errors.push("FlavorNote slug не должен быть пустым");
    else if (assignment.note.slug !== noteSlug) errors.push(`FlavorNote slug ${assignment.note.slug} должен быть нормализован`);
    if (!FLAVOR_NOTE_CATEGORIES.includes(assignment.note.category as typeof FLAVOR_NOTE_CATEGORIES[number])) errors.push(`Некорректная категория ноты ${assignment.note.slug}`);
    if (!FLAVOR_NOTE_TYPES.includes(assignment.noteType as typeof FLAVOR_NOTE_TYPES[number])) errors.push(`Некорректный noteType для ${assignment.note.slug}`);
    if (!Number.isFinite(assignment.intensity) || assignment.intensity < 1 || assignment.intensity > 10) errors.push(`Интенсивность ноты ${assignment.note.slug} должна быть от 1 до 10`);
    if (noteSlugs.has(noteSlug)) errors.push(`Повторяющаяся FlavorNote: ${noteSlug}`);
    noteSlugs.add(noteSlug);
  }
  return errors.length ? { success: false, errors } : { success: true, errors, normalizedValue: { ...value, name, slug } };
}
