export const PROFILE_STATUSES = ["DRAFT", "TESTED", "VERIFIED"] as const;
export const PROFILE_SOURCES = ["MANUAL", "MANUFACTURER", "COMMUNITY", "MIXED"] as const;
export const FLAVOR_NOTE_CATEGORIES = ["FRUIT", "BERRY", "CITRUS", "DESSERT", "DRINK", "SPICE", "FLORAL", "HERBAL", "COOLING", "NUT", "COFFEE", "CHOCOLATE", "DAIRY", "TROPICAL", "SMOKY", "OTHER"] as const;
export const FLAVOR_NOTE_TYPES = ["DOMINANT", "SECONDARY", "ACCENT"] as const;
// ADR-014: which 7 of the 18 Prisma sensory fields are the Product Flavor Profile Registry's target
// model (a real evidence class exists for most products); the other 11 are excluded from that registry.
// ADR-015/ADR-017: this core/secondary split no longer affects nullability - ALL 18 fields are nullable
// in Prisma and in FlavorProfile below. `null` means "not measured for this product", never a stand-in
// for 0; every consumer must treat it that way explicitly. The constants below remain useful only as a
// reference for which 7 fields the registry (and its importer) actually populates.
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
export type FlavorProfile = Record<FlavorProfileField, number | null>;
export const measuredValue = (value: number | null): value is number => value !== null;
// ADR-017: intensity drives dominance/ranking math across mix-profile, mix-compatibility and
// mix-recommendation, which all need a definite comparable number for every component. An unmeasured
// component falls back to this neutral midpoint - never 0, which would make it look artificially weak.
export const NEUTRAL_INTENSITY_FALLBACK = 5;
export const resolveIntensity = (intensity: number | null): number => intensity ?? NEUTRAL_INTENSITY_FALLBACK;
export type FlavorNote = { name: string; slug: string; category: FlavorNoteCategory };
export type FlavorNoteAssignment = { note: FlavorNote; intensity: number; noteType: FlavorNoteType };
export type FlavorProfileInput = FlavorProfile & { name: string; slug: string; profileStatus: FlavorProfileStatus | string; profileSource: FlavorProfileSource | string; notes: FlavorNoteAssignment[] };
