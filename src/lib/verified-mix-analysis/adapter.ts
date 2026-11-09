import { PROFILE_CONFIDENCE_RELIABILITY_SCORE } from "../canonical-mix-scoring/constants";
import type { CanonicalMixComponentInput, EffectiveProfileCandidate } from "../canonical-mix-scoring";
import { toLegacyCategory } from "../flavor-knowledge/note-taxonomy";
import type { FlavorProfile } from "../flavors/types";
import { FLAVOR_PROFILE_FIELDS } from "../flavors/types";
import { getProductFlavorProfile } from "../product-flavor-profile";
import type { ProductFlavorProfile } from "../product-flavor-profile";
import { TOBACCO_IDENTITY_DECISION_REGISTRY } from "../tobacco-identity-decisions";
import type { TobaccoIdentityDecisionRegistry } from "../tobacco-identity-decisions";
import type { VerifiedMixRecipe } from "../verified-mix-recipe";
import { VerifiedMixAnalysisError } from "./errors";

const emptyProfile = (): FlavorProfile => Object.fromEntries(FLAVOR_PROFILE_FIELDS.map(field => [field, null])) as FlavorProfile;

const profileFromProductFlavorProfile = (profile: ProductFlavorProfile): Partial<FlavorProfile> => ({
  sweetness: profile.dimensions.sweetness?.value,
  acidity: profile.dimensions.sourness?.value,
  freshness: profile.dimensions.freshness?.value,
  intensity: profile.dimensions.intensity?.value,
  strength: profile.dimensions.strength?.value,
  heatResistance: profile.dimensions.heatResistance?.value,
  juiciness: profile.dimensions.juiciness?.value,
});

const categoryNotes = (canonicalProductId: string, profile: ProductFlavorProfile) => profile.dominantNoteIds.flatMap(category => {
  const legacyCategory = toLegacyCategory(category);
  if (!legacyCategory) return [];
  // The registry records an evidence-backed category, not an invented concrete flavour.
  // DOMINANT/10 is only the deterministic encoding of that categorical signal for the
  // existing Mix Profile Engine; it is not a fabricated sensory profile measurement.
  return [{
    noteId: `canonical-category:${canonicalProductId}:${category}`,
    noteName: category,
    noteSlug: `category:${category.toLowerCase()}`,
    category: legacyCategory,
    intensity: 10,
    noteType: "DOMINANT" as const,
  }];
});

const candidateFromProductProfile = (canonicalProductId: string, profile: ProductFlavorProfile): EffectiveProfileCandidate => ({
  type: "CANONICAL_PRODUCT_PROFILE",
  profileId: `canonical:${canonicalProductId}`,
  profile: profileFromProductFlavorProfile(profile),
  notes: categoryNotes(canonicalProductId, profile),
  reliabilityScore: PROFILE_CONFIDENCE_RELIABILITY_SCORE[profile.overallConfidence],
});

export type VerifiedRecipeAnalysisAdapterOptions = {
  readonly decisions?: TobaccoIdentityDecisionRegistry;
  readonly getProductProfile?: (canonicalProductId: string) => Readonly<ProductFlavorProfile> | null;
};

export const buildCanonicalMixInputFromVerifiedRecipe = (
  recipe: VerifiedMixRecipe,
  options: VerifiedRecipeAnalysisAdapterOptions = {},
): readonly CanonicalMixComponentInput[] => {
  const decisions = options.decisions ?? TOBACCO_IDENTITY_DECISION_REGISTRY;
  const findProductProfile = options.getProductProfile ?? getProductFlavorProfile;
  return recipe.components.map(component => {
    const lookup = decisions.getByCanonicalProductId(component.canonicalProductId);
    if (lookup.status !== "FOUND" || lookup.decision.decision.status !== "RESOLVED") {
      throw new VerifiedMixAnalysisError(`Canonical product ${component.canonicalProductId} отсутствует среди RESOLVED identity decisions.`, "CANONICAL_IDENTITY_NOT_RESOLVED");
    }
    const decision = lookup.decision.decision;
    const canonicalProductId = decision.canonicalProductId;
    const manufacturer = decision.canonicalManufacturerName;
    const productName = decision.canonicalProductName;
    if (!canonicalProductId || !manufacturer || !productName) {
      throw new VerifiedMixAnalysisError(`RESOLVED decision for ${component.canonicalProductId} не содержит полную canonical identity.`, "CANONICAL_IDENTITY_NOT_RESOLVED");
    }
    const productProfile = findProductProfile(canonicalProductId);
    const profileCandidates = productProfile ? [candidateFromProductProfile(canonicalProductId, productProfile)] : [];
    const notes = productProfile ? categoryNotes(canonicalProductId, productProfile) : [{
      noteId: `canonical-fallback:${canonicalProductId}`,
      noteName: "OTHER",
      noteSlug: `canonical-fallback:${canonicalProductId}`,
      category: "OTHER" as const,
      intensity: 10,
      noteType: "DOMINANT" as const,
    }];
    return {
      flavorId: canonicalProductId,
      brandName: manufacturer,
      flavorName: productName,
      flavorSlug: canonicalProductId,
      percentage: component.percentage,
      profile: emptyProfile(),
      notes,
      catalogStatus: "FOUND",
      identity: {
        sourceComponentId: canonicalProductId,
        rawManufacturer: manufacturer,
        rawProductLine: decision.canonicalProductLineName,
        rawProductName: productName,
        canonicalProductId,
        sourceType: "VERIFIED_MIX_RECIPE",
        sourceStatus: "RESOLVED",
      },
      profileCandidates,
      // A verified recipe is a recipe source, not a sensory Prisma/source profile.
      sourceProfileAvailable: false,
      proportionConfirmed: recipe.verification.proportionsConfirmed,
      independentEvidenceCount: recipe.verification.independentEvidenceCount,
    } satisfies CanonicalMixComponentInput;
  });
};
