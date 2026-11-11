import type { FlavorProfileCoreField } from "../flavors/types";

export const SENSORY_EVIDENCE_FIELDS: readonly FlavorProfileCoreField[] = Object.freeze([
  "strength", "heatResistance", "intensity", "sweetness", "acidity", "juiciness", "freshness",
]);

// ADR-026: at least four of the seven registry dimensions must be measured on a percentage-weighted
// basis before a numeric quality prediction becomes public. This is a presentation policy, not scoring math.
export const PUBLIC_QUALITY_READINESS_POLICY = Object.freeze({
  minimumWeightedSensoryFieldCoverage: 50,
  minimumMeasuredFieldsPerComponentEquivalent: 4,
});
