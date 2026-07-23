export const PRODUCT_FLAVOR_PROFILE_VERSION = "product-flavor-profile-v1" as const;
export const FLAVOR_DIMENSION_IDS = ["sweetness", "sourness", "freshness", "intensity", "strength", "heatResistance", "juiciness"] as const;
export const EVIDENCE_ORIGINS = ["MANUFACTURER_CLAIM", "REVIEW_AGGREGATE", "EDITORIAL_ASSESSMENT"] as const;
export const CONFIDENCE_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export const FLAVOR_DIMENSION_MIN_VALUE = 0;
export const FLAVOR_DIMENSION_MAX_VALUE = 10;

// ADR-016: labels for DataCompletenessLevel, keyed by how many of the 7 target dimensions are filled.
export const DATA_COMPLETENESS_LEVELS = ["DETAILED", "GOOD", "BASIC", "MINIMAL"] as const;
export const DATA_COMPLETENESS_LABELS_RU: Readonly<Record<(typeof DATA_COMPLETENESS_LEVELS)[number], string>> = {
  DETAILED: "Подробный профиль",
  GOOD: "Хороший профиль",
  BASIC: "Базовый профиль",
  MINIMAL: "Минимум данных",
};
