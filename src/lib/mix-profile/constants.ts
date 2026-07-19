export const MIX_PROFILE_CALCULATION_VERSION = "mix-profile-v1" as const;
export const PERCENTAGE_TOLERANCE = 0.0001;
export const NOTE_TYPE_WEIGHTS = { DOMINANT: 1, SECONDARY: 0.65, ACCENT: 0.35 } as const;
export const MIN_COMPONENTS = 2;
export const MAX_COMPONENTS = 5;

export const roundTo = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};
