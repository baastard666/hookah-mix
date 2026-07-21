import type { CanonicalTobaccoProductFilters, DecisionApplicableIdentityRecord } from "./types";

export const filterCanonicalTobaccoProducts = (records: readonly DecisionApplicableIdentityRecord[], filters: CanonicalTobaccoProductFilters): readonly DecisionApplicableIdentityRecord[] => records.filter(record => {
  if (filters.manufacturerId !== undefined && record.manufacturerId !== filters.manufacturerId) return false;
  if (filters.productLineId !== undefined && record.productLineId !== filters.productLineId) return false;
  if (filters.canonicalProductId !== undefined && record.canonicalProductId !== filters.canonicalProductId) return false;
  if (filters.identityStatus !== undefined && record.identityStatus !== filters.identityStatus) return false;
  if (filters.confidence !== undefined && record.confidence !== filters.confidence) return false;
  if (filters.evidenceType !== undefined && !record.evidenceTypes.includes(filters.evidenceType)) return false;
  if (filters.sourcePriority !== undefined && record.sourcePriority !== filters.sourcePriority) return false;
  if (filters.usedInVerifiedMix !== undefined && record.usedInVerifiedMix !== filters.usedInVerifiedMix) return false;
  if (filters.unresolvedOnly && record.identityStatus !== "UNRESOLVED" && record.identityStatus !== "NOT_CHECKED") return false;
  if (filters.confirmedDecisionsOnly && !record.confirmedDecision) return false;
  return true;
});
