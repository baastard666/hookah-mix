import { FLAVOR_PROFILE_CORE_FIELDS, FLAVOR_PROFILE_SECONDARY_FIELDS, type FlavorProfile, type FlavorProfileCoreField, type FlavorProfileSecondaryField } from "../flavors/types";
import { roundTo } from "./constants";
import type { MixProfileComponentInput } from "./types";

const clampScore = (value: number): number => Math.max(0, Math.min(10, roundTo(value, 1)));
const weightedCoreValue = (components: readonly MixProfileComponentInput[], field: FlavorProfileCoreField): number =>
  clampScore(components.reduce((sum, component) => sum + component.profile[field] * component.percentage / 100, 0));

// ADR-015: null means "not measured" - components missing a secondary field are excluded from both
// the numerator and the denominator (partial average over the components that do have data), never
// treated as a measured 0. If no component in the mix measured this field, the mix-level value is null too.
const weightedSecondaryValue = (components: readonly MixProfileComponentInput[], field: FlavorProfileSecondaryField): number | null => {
  const measured = components.filter(component => component.profile[field] !== null);
  const measuredPercentage = measured.reduce((sum, component) => sum + component.percentage, 0);
  if (!measured.length || measuredPercentage <= 0) return null;
  return clampScore(measured.reduce((sum, component) => sum + component.profile[field]! * component.percentage, 0) / measuredPercentage);
};

export function calculateWeightedProfile(components: readonly MixProfileComponentInput[]): FlavorProfile {
  return {
    ...Object.fromEntries(FLAVOR_PROFILE_CORE_FIELDS.map(field => [field, weightedCoreValue(components, field)])),
    ...Object.fromEntries(FLAVOR_PROFILE_SECONDARY_FIELDS.map(field => [field, weightedSecondaryValue(components, field)])),
  } as FlavorProfile;
}
