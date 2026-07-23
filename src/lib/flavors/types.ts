export const PROFILE_STATUSES = ["DRAFT", "TESTED", "VERIFIED"] as const;
export const PROFILE_SOURCES = ["MANUAL", "MANUFACTURER", "COMMUNITY", "MIXED"] as const;
export const FLAVOR_NOTE_CATEGORIES = ["FRUIT", "BERRY", "CITRUS", "DESSERT", "DRINK", "SPICE", "FLORAL", "HERBAL", "COOLING", "NUT", "COFFEE", "CHOCOLATE", "DAIRY", "TROPICAL", "SMOKY", "OTHER"] as const;
export const FLAVOR_NOTE_TYPES = ["DOMINANT", "SECONDARY", "ACCENT"] as const;
// ADR-014/ADR-015: core fields have a real evidence source for most products and stay required.
// Secondary fields have zero evidence-backed source for the vast majority of products (ADR-015) and are nullable:
// `null` means "not measured for this product", never a stand-in for 0. Every consumer must treat it that way explicitly.
export const FLAVOR_PROFILE_CORE_FIELDS = ["strength", "heatResistance", "intensity", "sweetness", "acidity", "juiciness", "freshness"] as const;
export const FLAVOR_PROFILE_SECONDARY_FIELDS = ["cooling", "creaminess", "bitterness", "dryness", "dessertLevel", "spiceLevel", "floralLevel", "herbalLevel", "smokyLevel", "naturalness", "persistence"] as const;
export const FLAVOR_PROFILE_FIELDS = [...FLAVOR_PROFILE_CORE_FIELDS, ...FLAVOR_PROFILE_SECONDARY_FIELDS] as const;

export type FlavorProfileStatus = typeof PROFILE_STATUSES[number];
export type FlavorProfileSource = typeof PROFILE_SOURCES[number];
export type FlavorNoteCategory = typeof FLAVOR_NOTE_CATEGORIES[number];
export type FlavorNoteType = typeof FLAVOR_NOTE_TYPES[number];
export type FlavorProfileCoreField = typeof FLAVOR_PROFILE_CORE_FIELDS[number];
export type FlavorProfileSecondaryField = typeof FLAVOR_PROFILE_SECONDARY_FIELDS[number];
export type FlavorProfileField = typeof FLAVOR_PROFILE_FIELDS[number];
export type FlavorProfile = Record<FlavorProfileCoreField, number> & Record<FlavorProfileSecondaryField, number | null>;
export const isSecondaryField = (field: FlavorProfileField): field is FlavorProfileSecondaryField => (FLAVOR_PROFILE_SECONDARY_FIELDS as readonly string[]).includes(field);
export const measuredValue = (value: number | null): value is number => value !== null;
export type FlavorNote = { name: string; slug: string; category: FlavorNoteCategory };
export type FlavorNoteAssignment = { note: FlavorNote; intensity: number; noteType: FlavorNoteType };
export type FlavorProfileInput = FlavorProfile & { name: string; slug: string; profileStatus: FlavorProfileStatus | string; profileSource: FlavorProfileSource | string; notes: FlavorNoteAssignment[] };
