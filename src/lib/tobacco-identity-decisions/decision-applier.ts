import { validateTobaccoIdentityDecision } from "./decision-validator";
import { deepFreezeClone } from "./normalization";
import type { ApplyTobaccoIdentityDecisionsResult, DecisionApplicableIdentityRecord, TobaccoIdentityConfidence, TobaccoIdentityDecisionIssue, TobaccoIdentityDecisionRegistry } from "./types";

const confidenceRank: Record<TobaccoIdentityConfidence, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
const conservativeConfidence = (values: readonly TobaccoIdentityConfidence[]): TobaccoIdentityConfidence | null => values.length ? [...values].sort((a, b) => confidenceRank[a] - confidenceRank[b])[0]! : null;
export const applyTobaccoIdentityDecisions = (records: readonly DecisionApplicableIdentityRecord[], registry: TobaccoIdentityDecisionRegistry): ApplyTobaccoIdentityDecisionsResult => {
  let appliedDecisionCount = 0; let skippedDecisionCount = 0; let conflictCount = 0; let invalidDecisionCount = 0;
  const issues: TobaccoIdentityDecisionIssue[] = [];
  const output = records.map(record => {
    const lookup = registry.getBySourceIdentity(record.manufacturer, record.productLine, record.productName);
    if (lookup.status === "NOT_FOUND") return { ...record };
    if (lookup.status === "CONFLICT") { conflictCount += 1; issues.push(...lookup.issues); return { ...record }; }
    const validation = validateTobaccoIdentityDecision(lookup.decision);
    if (!validation.applicable) { skippedDecisionCount += 1; if (!validation.valid) invalidDecisionCount += 1; issues.push(...validation.issues); return { ...record }; }
    const decision = lookup.decision;
    if (decision.sourceIdentity.sourcePriority === "P2" || decision.sourceIdentity.sourcePriority === "P3") { skippedDecisionCount += 1; return { ...record }; }
    appliedDecisionCount += 1;
    const identityStatus = decision.decision.status === "REJECTED" ? "REJECTED" : decision.decision.status;
    return {
      ...record, identityStatus, manufacturerId: decision.decision.manufacturerId, productLineId: decision.decision.productLineId,
      canonicalProductId: decision.decision.canonicalProductId, canonicalProductName: decision.decision.canonicalProductName,
      confidence: conservativeConfidence(decision.evidence.map(evidence => evidence.confidence)), evidenceTypes: [...new Set(decision.evidence.map(evidence => evidence.sourceType))], confirmedDecision: true,
    } satisfies DecisionApplicableIdentityRecord;
  });
  return deepFreezeClone({ records: output, appliedDecisionCount, skippedDecisionCount, conflictCount, invalidDecisionCount, issues }) as ApplyTobaccoIdentityDecisionsResult;
};
