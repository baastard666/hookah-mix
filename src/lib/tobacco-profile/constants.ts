export const TOBACCO_PROFILE_VERSION = "tobacco-profile-v1" as const;
export const STRENGTH_LEVELS = ["LOW", "MEDIUM_LOW", "MEDIUM", "MEDIUM_HIGH", "HIGH", "UNKNOWN"] as const;
export const HEAT_RESISTANCE_LEVELS = ["LOW", "MEDIUM", "HIGH", "UNKNOWN"] as const;
export const LEAF_TYPES = ["VIRGINIA", "BURLEY", "CIGAR", "BLEND", "UNKNOWN"] as const;
export const CONFIDENCE_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export const SOURCE_TYPES = ["MANUFACTURER", "MANUFACTURER_CLAIM", "OFFICIAL_MATERIAL", "EXPERT_CONSENSUS", "SECONDARY_SOURCES", "INTERNAL_TEST", "UNKNOWN"] as const;

export const normalizeTobaccoName = (value: string): string =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");
