import { FLAVOR_KNOWLEDGE_REGISTRY } from "../flavor-knowledge";
import { TOBACCO_IDENTITY_DECISION_REGISTRY } from "../tobacco-identity-decisions";
import { FLAVOR_DIMENSION_MAX_VALUE, FLAVOR_DIMENSION_MIN_VALUE } from "./constants";
import type { ConfidenceLevel, ProductFlavorProfile, ProductFlavorProfileIssue } from "./types";

const KNOWN_NOTE_CATEGORY_IDS = new Set(FLAVOR_KNOWLEDGE_REGISTRY.categories.map(category => category.id));
const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

const issue = (code: ProductFlavorProfileIssue["code"], canonicalProductId: string, message: string): ProductFlavorProfileIssue => ({ code, canonicalProductId, message });

export const validateProductFlavorProfile = (profile: ProductFlavorProfile): readonly ProductFlavorProfileIssue[] => {
  const issues: ProductFlavorProfileIssue[] = [];
  const { canonicalProductId } = profile;

  const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getByCanonicalProductId(canonicalProductId);
  if (lookup.status !== "FOUND") {
    issues.push(issue("CANONICAL_PRODUCT_ID_NOT_FOUND", canonicalProductId, `canonicalProductId "${canonicalProductId}" is not present in the Tobacco Identity Decision Registry.`));
  } else if (lookup.decision.decision.status !== "RESOLVED") {
    issues.push(issue("CANONICAL_PRODUCT_ID_NOT_RESOLVED", canonicalProductId, `canonicalProductId "${canonicalProductId}" has decision status "${lookup.decision.decision.status}", expected RESOLVED.`));
  }

  const filledDimensions = Object.entries(profile.dimensions).filter((entry): entry is [string, NonNullable<typeof entry[1]>] => entry[1] !== undefined);
  filledDimensions.forEach(([dimensionId, dimension]) => {
    if (dimension.value < FLAVOR_DIMENSION_MIN_VALUE || dimension.value > FLAVOR_DIMENSION_MAX_VALUE) {
      issues.push(issue("DIMENSION_VALUE_OUT_OF_RANGE", canonicalProductId, `Dimension "${dimensionId}" value ${dimension.value} is outside the 0-10 range.`));
    }
    if (dimension.evidence.length === 0) {
      issues.push(issue("DIMENSION_EVIDENCE_MISSING", canonicalProductId, `Dimension "${dimensionId}" has no evidence.`));
    }
  });

  const minimumFilledConfidence = filledDimensions.length
    ? filledDimensions.reduce<ConfidenceLevel>((lowest, [, dimension]) => (CONFIDENCE_RANK[dimension.confidence] < CONFIDENCE_RANK[lowest] ? dimension.confidence : lowest), "HIGH")
    : "LOW";
  if (CONFIDENCE_RANK[profile.overallConfidence] > CONFIDENCE_RANK[minimumFilledConfidence]) {
    issues.push(issue("OVERALL_CONFIDENCE_EXCEEDS_MINIMUM", canonicalProductId, `overallConfidence "${profile.overallConfidence}" exceeds the minimum filled dimension confidence "${minimumFilledConfidence}".`));
  }

  profile.dominantNoteIds.forEach(noteId => {
    if (!KNOWN_NOTE_CATEGORY_IDS.has(noteId)) {
      issues.push(issue("DOMINANT_NOTE_ID_UNKNOWN", canonicalProductId, `dominantNoteIds references unknown Flavor Knowledge Layer category "${noteId}".`));
    }
  });

  return issues;
};

export const validateProductFlavorProfiles = (profiles: readonly ProductFlavorProfile[]): readonly ProductFlavorProfileIssue[] => {
  const issues: ProductFlavorProfileIssue[] = [];
  const seen = new Set<string>();
  profiles.forEach(profile => {
    if (seen.has(profile.canonicalProductId)) {
      issues.push(issue("DUPLICATE_CANONICAL_PRODUCT_ID", profile.canonicalProductId, `canonicalProductId "${profile.canonicalProductId}" appears more than once in the registry.`));
    }
    seen.add(profile.canonicalProductId);
    issues.push(...validateProductFlavorProfile(profile));
  });
  return issues;
};
