import { deepFreezeClone } from "./normalization";
import type { PublicTobaccoIdentityDecision, TobaccoIdentityDecision, TobaccoIdentityDecisionIssue } from "./types";

export const mapTobaccoIdentityDecisionToPublic = (decision: TobaccoIdentityDecision): PublicTobaccoIdentityDecision => deepFreezeClone({
  status: decision.decision.status, manufacturerId: decision.decision.manufacturerId, productLineId: decision.decision.productLineId,
  canonicalProductId: decision.decision.canonicalProductId, canonicalManufacturerName: decision.decision.canonicalManufacturerName,
  canonicalProductLineName: decision.decision.canonicalProductLineName, canonicalProductName: decision.decision.canonicalProductName,
  aliases: decision.decision.aliases, confidence: decision.evidence.length ? decision.evidence.map(item => item.confidence).sort()[0]! : null,
  evidenceTypes: [...new Set(decision.evidence.filter(item => item.publicSafe).map(item => item.sourceType))],
}) as PublicTobaccoIdentityDecision;
export const auditPublicTobaccoIdentityDecisions = (output: readonly PublicTobaccoIdentityDecision[], privateTokens: readonly string[]): readonly TobaccoIdentityDecisionIssue[] => {
  const json = JSON.stringify(output);
  return privateTokens.filter(token => token.trim() && json.includes(token)).map(token => ({ code: "PUBLIC_PRIVATE_REFERENCE_EXPOSED" as const, severity: "ERROR" as const, message: `Public output contains private token of length ${token.length}.` }));
};
