import { deepFreezeClone } from "./normalization";
import type { ApplyTobaccoIdentityDecisionsResult, DecisionApplicableIdentityRecord, IdentityCoverageCounts, TobaccoIdentityCoverageComparison } from "./types";

const counts = (records: readonly DecisionApplicableIdentityRecord[]): IdentityCoverageCounts => ({
  resolved: records.filter(record => record.identityStatus === "RESOLVED").length,
  manufacturerOnly: records.filter(record => record.identityStatus === "MANUFACTURER_ONLY").length,
  unresolved: records.filter(record => record.identityStatus === "UNRESOLVED" || record.identityStatus === "NOT_CHECKED").length,
  ambiguous: records.filter(record => record.identityStatus === "AMBIGUOUS").length,
  invalid: records.filter(record => record.identityStatus === "INVALID" || record.identityStatus === "REJECTED").length,
});
export const compareTobaccoIdentityCoverage = (before: readonly DecisionApplicableIdentityRecord[], applied: ApplyTobaccoIdentityDecisionsResult): TobaccoIdentityCoverageComparison => {
  const after = applied.records;
  const select = (records: readonly DecisionApplicableIdentityRecord[], predicate: (record: DecisionApplicableIdentityRecord) => boolean) => counts(records.filter(predicate));
  const allBefore = select(before, record => record.scope !== "USER_PRIORITY"); const allAfter = select(after, record => record.scope !== "USER_PRIORITY");
  const componentsBefore = select(before, record => record.scope === "COMPONENT"); const componentsAfter = select(after, record => record.scope === "COMPONENT");
  const catalogBefore = select(before, record => record.scope === "CATALOG"); const catalogAfter = select(after, record => record.scope === "CATALOG");
  const result: TobaccoIdentityCoverageComparison = {
    version: "tobacco-identity-coverage-v1", before: allBefore, after: allAfter, componentsBefore, componentsAfter, catalogBefore, catalogAfter,
    verifiedComponents: { before: select(before, record => record.scope === "COMPONENT" && record.usedInVerifiedMix), after: select(after, record => record.scope === "COMPONENT" && record.usedInVerifiedMix) },
    userPriority: { before: select(before, record => record.scope === "USER_PRIORITY"), after: select(after, record => record.scope === "USER_PRIORITY") },
    resolvedDelta: allAfter.resolved - allBefore.resolved, manufacturerOnlyDelta: allAfter.manufacturerOnly - allBefore.manufacturerOnly, unresolvedDelta: allAfter.unresolved - allBefore.unresolved,
    appliedDecisionCount: applied.appliedDecisionCount, skippedDecisionCount: applied.skippedDecisionCount, conflictCount: applied.conflictCount, invalidDecisionCount: applied.invalidDecisionCount, issues: applied.issues,
  };
  return deepFreezeClone(result) as TobaccoIdentityCoverageComparison;
};
