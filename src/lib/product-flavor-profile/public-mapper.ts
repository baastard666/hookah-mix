import type { FlavorDimensionId, ProductFlavorProfile, PublicFlavorDimensionValue, PublicProductFlavorProfile } from "./types";

const toPublicDimensionValue = (value: ProductFlavorProfile["dimensions"][FlavorDimensionId]): PublicFlavorDimensionValue | undefined =>
  value ? { value: value.value, confidence: value.confidence, evidence: value.evidence.map(item => ({ type: item.type, title: item.title, checkedAt: item.checkedAt })) } : undefined;

export const mapProductFlavorProfileToPublic = (profile: ProductFlavorProfile): PublicProductFlavorProfile => ({
  canonicalProductId: profile.canonicalProductId,
  dimensions: Object.fromEntries(
    (Object.entries(profile.dimensions) as [FlavorDimensionId, ProductFlavorProfile["dimensions"][FlavorDimensionId]][])
      .filter((entry): entry is [FlavorDimensionId, NonNullable<typeof entry[1]>] => entry[1] !== undefined)
      .map(([dimensionId, value]) => [dimensionId, toPublicDimensionValue(value)!]),
  ) as PublicProductFlavorProfile["dimensions"],
  dominantNoteIds: profile.dominantNoteIds,
  overallConfidence: profile.overallConfidence,
});
