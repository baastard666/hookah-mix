import { FLAVOR_PROFILE_FIELDS, type FlavorProfile, type FlavorProfileField } from "../flavors/types";
import { roundTo } from "./constants";
import type { MixProfileComponentInput } from "./types";

const clampScore = (value: number): number => Math.max(0, Math.min(10, roundTo(value, 1)));

// ADR-015/ADR-017: null means "not measured" for any of the 18 fields - components missing a field are
// excluded from both the numerator and the denominator (partial average over the components that do have
// data), never treated as a measured 0. If no component in the mix measured this field, the mix-level
// value is null too.
const weightedValue = (components: readonly MixProfileComponentInput[], field: FlavorProfileField): number | null => {
  const measured = components.filter(component => component.profile[field] !== null);
  const measuredPercentage = measured.reduce((sum, component) => sum + component.percentage, 0);
  if (!measured.length || measuredPercentage <= 0) return null;
  return clampScore(measured.reduce((sum, component) => sum + component.profile[field]! * component.percentage, 0) / measuredPercentage);
};

export function calculateWeightedProfile(components: readonly MixProfileComponentInput[]): FlavorProfile {
  return Object.fromEntries(FLAVOR_PROFILE_FIELDS.map(field => [field, weightedValue(components, field)])) as FlavorProfile;
}
