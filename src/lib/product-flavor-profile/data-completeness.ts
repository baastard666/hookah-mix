import type { DataCompletenessLevel, ProductFlavorProfile } from "./types";

// ADR-016: bucket boundaries fixed by that decision - 6-7/4-5/2-3/0-1 of the 7 target dimensions filled.
export const countFilledDimensions = (profile: Pick<ProductFlavorProfile, "dimensions">): number =>
  Object.values(profile.dimensions).filter((value): value is NonNullable<typeof value> => value !== undefined).length;

export const calculateDataCompleteness = (profile: Pick<ProductFlavorProfile, "dimensions">): DataCompletenessLevel => {
  const filled = countFilledDimensions(profile);
  if (filled >= 6) return "DETAILED";
  if (filled >= 4) return "GOOD";
  if (filled >= 2) return "BASIC";
  return "MINIMAL";
};
