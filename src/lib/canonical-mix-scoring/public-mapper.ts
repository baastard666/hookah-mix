import type { CanonicalMixScoringResult, PublicCanonicalMixScoringResult } from "./types";

export const toPublicCanonicalMixScoringResult = (result: CanonicalMixScoringResult): PublicCanonicalMixScoringResult => ({
  ...result,
  componentResolutions: result.componentResolutions.map(item => ({
    percentage: item.percentage,
    normalizedIdentity: item.normalizedIdentity,
    resolution: {
      status: item.resolution.status,
      canonicalProductId: item.resolution.canonicalProductId,
      canonicalManufacturer: item.resolution.canonicalManufacturer,
      canonicalProductLine: item.resolution.canonicalProductLine,
      canonicalProductName: item.resolution.canonicalProductName,
      matchedAlias: item.resolution.matchedAlias,
      matchMethod: item.resolution.matchMethod,
      confidence: item.resolution.confidence,
    },
  })),
});
