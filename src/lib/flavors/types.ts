export const PROFILE_STATUSES = ["DRAFT", "TESTED", "VERIFIED"] as const;
export const PROFILE_SOURCES = ["MANUAL", "MANUFACTURER", "COMMUNITY", "MIXED"] as const;
export const FLAVOR_NOTE_CATEGORIES = ["FRUIT", "BERRY", "CITRUS", "DESSERT", "DRINK", "SPICE", "FLORAL", "HERBAL", "COOLING", "NUT", "COFFEE", "CHOCOLATE", "DAIRY", "TROPICAL", "SMOKY", "OTHER"] as const;
export const FLAVOR_NOTE_TYPES = ["DOMINANT", "SECONDARY", "ACCENT"] as const;
export const FLAVOR_PROFILE_FIELDS = ["sweetness", "acidity", "bitterness", "creaminess", "cooling", "strength", "intensity", "heatResistance", "dryness", "juiciness", "freshness", "dessertLevel", "spiceLevel", "floralLevel", "herbalLevel", "smokyLevel", "naturalness", "persistence"] as const;

export type FlavorProfileStatus = typeof PROFILE_STATUSES[number];
export type FlavorProfileSource = typeof PROFILE_SOURCES[number];
export type FlavorNoteCategory = typeof FLAVOR_NOTE_CATEGORIES[number];
export type FlavorNoteType = typeof FLAVOR_NOTE_TYPES[number];
export type FlavorProfileField = typeof FLAVOR_PROFILE_FIELDS[number];
export type FlavorProfile = Record<FlavorProfileField, number>;
export type FlavorNote = { name: string; slug: string; category: FlavorNoteCategory };
export type FlavorNoteAssignment = { note: FlavorNote; intensity: number; noteType: FlavorNoteType };
export type FlavorProfileInput = FlavorProfile & { name: string; slug: string; profileStatus: FlavorProfileStatus | string; profileSource: FlavorProfileSource | string; notes: FlavorNoteAssignment[] };
