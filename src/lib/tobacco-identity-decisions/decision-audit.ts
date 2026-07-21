import { createSourceIdentityKey } from "./normalization";
import { validateTobaccoIdentityDecision } from "./decision-validator";
import { listManufacturerProfiles, listProductLineProfiles } from "../tobacco-profile";
import type { TobaccoIdentityDecision, TobaccoIdentityDecisionIssue } from "./types";

const issue = (decision: TobaccoIdentityDecision, code: TobaccoIdentityDecisionIssue["code"], message: string): TobaccoIdentityDecisionIssue => ({ code, severity: "ERROR", decisionId: decision.id, groupId: decision.sourceIdentity.sourceGroupId, message });
export const auditTobaccoIdentityDecisions = (decisions: readonly TobaccoIdentityDecision[]): readonly TobaccoIdentityDecisionIssue[] => {
  const issues = decisions.flatMap(decision => validateTobaccoIdentityDecision(decision).issues);
  const seenId = new Map<string, TobaccoIdentityDecision>();
  const seenGroup = new Map<string, TobaccoIdentityDecision>();
  const seenSource = new Map<string, TobaccoIdentityDecision>();
  const seenCanonical = new Map<string, TobaccoIdentityDecision>();
  for (const decision of decisions) {
    const duplicate = seenId.get(decision.id) ?? seenGroup.get(decision.sourceIdentity.sourceGroupId);
    if (duplicate) issues.push(issue(decision, "DECISION_DUPLICATE", `Decision duplicates ${duplicate.id}.`));
    const sourceKey = createSourceIdentityKey(decision.sourceIdentity.manufacturer, decision.sourceIdentity.productLine, decision.sourceIdentity.productName);
    const sourceMatch = seenSource.get(sourceKey);
    if (sourceMatch && sourceMatch.decision.status !== decision.decision.status) issues.push(issue(decision, "DECISION_CONFLICT", `Exact source identity conflicts with ${sourceMatch.id}.`));
    else if (sourceMatch) issues.push(issue(decision, "DECISION_DUPLICATE", `Exact source identity duplicates ${sourceMatch.id}.`));
    const canonical = decision.decision.canonicalProductId;
    const canonicalMatch = canonical ? seenCanonical.get(canonical) : undefined;
    if (canonicalMatch && createSourceIdentityKey(canonicalMatch.sourceIdentity.manufacturer, canonicalMatch.sourceIdentity.productLine, canonicalMatch.sourceIdentity.productName) !== sourceKey) issues.push(issue(decision, "CANONICAL_ID_TRANSLITERATION_COLLISION", `Canonical ID collides with ${canonicalMatch.id} after ASCII normalization.`));
    const manufacturerMatches = listManufacturerProfiles().filter(profile => [profile.manufacturer, ...profile.aliases].some(alias => createSourceIdentityKey(alias, null, "x") === createSourceIdentityKey(decision.sourceIdentity.manufacturer, null, "x")));
    if (decision.review.state === "CONFIRMED" && manufacturerMatches.length === 1 && decision.decision.manufacturerId && manufacturerMatches[0]!.manufacturerId !== decision.decision.manufacturerId) issues.push(issue(decision, "MANUFACTURER_CONFLICT", `Confirmed manufacturer conflicts with Registry ${manufacturerMatches[0]!.manufacturerId}.`));
    const lineMatches = decision.sourceIdentity.productLine ? listProductLineProfiles().filter(profile => profile.manufacturerId === decision.decision.manufacturerId && [profile.productLine, ...profile.aliases].some(alias => createSourceIdentityKey("x", alias, "x") === createSourceIdentityKey("x", decision.sourceIdentity.productLine, "x"))) : [];
    if (decision.review.state === "CONFIRMED" && lineMatches.length === 1 && decision.decision.productLineId && lineMatches[0]!.productLineId !== decision.decision.productLineId) issues.push(issue(decision, "CANONICAL_PRODUCT_CONFLICT", `Confirmed product line conflicts with Registry ${lineMatches[0]!.productLineId}.`));
    seenId.set(decision.id, decision); seenGroup.set(decision.sourceIdentity.sourceGroupId, decision); seenSource.set(sourceKey, decision); if (canonical) seenCanonical.set(canonical, decision);
  }
  return issues;
};
export const auditTobaccoIdentityDecisionRegistry = auditTobaccoIdentityDecisions;
