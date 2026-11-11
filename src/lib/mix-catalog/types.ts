import type { FlavorNoteCategory } from "../flavor-knowledge";
import type { FlavorProfileField } from "../flavors/types";
import type { PredictionReadiness } from "../prediction-readiness";

export const MIX_CATALOG_SCHEMA_VERSION = "verified-mix-catalog-v1" as const;
export type MixCatalogSchemaVersion = typeof MIX_CATALOG_SCHEMA_VERSION;
export type MixCatalogStrengthBucket = "LIGHT" | "MEDIUM" | "STRONG";
export type MixCatalogSort = "default" | "quality-desc" | "quality-asc" | "strength-desc" | "strength-asc" | "components-desc" | "components-asc";
export type MixCatalogComponentCountFilter = "2" | "3" | "4+";

export type MixCatalogMetricSummary = {
  readonly sweetness: number | null;
  readonly sourness: number | null;
  readonly freshness: number | null;
  readonly intensity: number | null;
  readonly strength: number | null;
  readonly heatResistance: number | null;
  readonly juiciness: number | null;
};

export type MixCatalogComponent = {
  readonly canonicalProductId: string;
  readonly manufacturer: string;
  readonly productLine: string | null;
  readonly productName: string;
  readonly percentage: number;
  readonly sourceStatedRole: string | null;
  readonly recordedRole: string | null;
  readonly influenceScore: number;
  readonly influenceShare: number;
  readonly dominantCategories: readonly FlavorNoteCategory[];
  readonly contributedParameters: readonly { readonly field: FlavorProfileField; readonly value: number; readonly source: "CANONICAL_PRODUCT_PROFILE" | "CANONICAL_TECHNICAL_PROFILE" }[];
};

export type MixCatalogRecommendation = {
  readonly type: string;
  readonly priority: string;
  readonly text: string;
};

export type MixCatalogSuggestedVariant = {
  readonly components: readonly { readonly canonicalProductId: string; readonly currentPercentage: number; readonly suggestedPercentage: number }[];
};

export type MixCatalogItem = {
  readonly recipeId: string;
  readonly slug: string;
  readonly title: string;
  readonly componentCount: number;
  readonly components: readonly MixCatalogComponent[];
  readonly tags: readonly string[];
  readonly dominantCategories: readonly FlavorNoteCategory[];
  readonly secondaryCategories: readonly FlavorNoteCategory[];
  readonly profile: MixCatalogMetricSummary;
  readonly dominance: { readonly canonicalProductId: string; readonly influenceShare: number; readonly level: "CLEAR" | "MODERATE" | "BALANCED" };
  readonly predicted: {
    /** Nullable public quality prediction. Internal diagnostics never enter the catalog snapshot. */
    readonly qualityScore: number | null;
    readonly predictionReadiness: PredictionReadiness;
    readonly compatibilityScore: number;
  };
  readonly explainability: {
    readonly positiveFactors: readonly { readonly category: string; readonly title: string; readonly description: string; readonly impact: number }[];
    readonly risks: readonly { readonly severity: "LOW" | "MEDIUM" | "HIGH"; readonly title: string; readonly description: string; readonly impact: number }[];
  };
  readonly recommendations: readonly MixCatalogRecommendation[];
  readonly suggestedVariant: MixCatalogSuggestedVariant | null;
  readonly observed: { readonly smokeScore: number | null; readonly hasObservedEvaluation: boolean; readonly evaluation: { readonly verdict: string; readonly numericRating: number | null } | null };
  readonly preparation: { readonly bowlType: string | null; readonly warmupMinutes: number | null; readonly coalCount: number | null } | null;
  readonly engineVersions: { readonly canonicalMixScoring: string; readonly mixProfile: string; readonly compatibility: string; readonly recommendation: string; readonly analysis: string };
};

export type MixCatalogSnapshot = {
  readonly schemaVersion: MixCatalogSchemaVersion;
  readonly items: readonly MixCatalogItem[];
};

export type MixCatalogCard = Pick<MixCatalogItem, "slug" | "title" | "componentCount" | "tags" | "dominantCategories"> & {
  readonly components: readonly Pick<MixCatalogComponent, "manufacturer" | "productName" | "percentage">[];
  readonly predictedQualityScore: number | null;
  readonly predictionReadiness: PredictionReadiness["status"];
  readonly strength: number | null;
  readonly sourness: number | null;
  readonly sweetness: number | null;
  readonly freshness: number | null;
};

export type MixCatalogFilters = {
  readonly q?: string;
  readonly componentCount?: MixCatalogComponentCountFilter;
  readonly category?: FlavorNoteCategory;
  readonly strength?: MixCatalogStrengthBucket;
  readonly trait?: "sour" | "sweet" | "fresh";
  readonly sort?: MixCatalogSort;
};
