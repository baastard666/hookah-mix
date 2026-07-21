import { FICTITIOUS_PRODUCT_LINES, PRODUCT_LINE_INTERPRETATIONS, TOBACCO_IDENTITY_DECISION_STATUSES, TOBACCO_IDENTITY_EVIDENCE_TYPES, TOBACCO_IDENTITY_REVIEW_STATES } from "./constants";
import { ASCII_CANONICAL_PRODUCT_ID_PATTERN } from "./canonical-id";
import { createCanonicalTobaccoProductId, normalizeDecisionText } from "./normalization";
import type { TobaccoIdentityDecision, TobaccoIdentityDecisionIssue, TobaccoIdentityDecisionValidation } from "./types";

const issue = (decision: TobaccoIdentityDecision, code: TobaccoIdentityDecisionIssue["code"], message: string, severity: TobaccoIdentityDecisionIssue["severity"] = "ERROR"): TobaccoIdentityDecisionIssue => ({ code, severity, decisionId: decision.id, groupId: decision.sourceIdentity.sourceGroupId, message });
const present = (value: string | null | undefined): value is string => Boolean(value?.trim());

export const validateTobaccoIdentityDecision = (decision: TobaccoIdentityDecision): TobaccoIdentityDecisionValidation => {
  const issues: TobaccoIdentityDecisionIssue[] = [];
  const source = decision.sourceIdentity;
  if (!present(decision.id) || !present(source.sourceGroupId) || !source.normalizedManufacturer || !source.normalizedProductName) issues.push(issue(decision, "DECISION_SOURCE_IDENTITY_INVALID", "Source identity must contain id, group, manufacturer and product name."));
  if (source.normalizedManufacturer !== normalizeDecisionText(source.manufacturer) || source.normalizedProductLine !== normalizeDecisionText(source.productLine) || source.normalizedProductName !== normalizeDecisionText(source.productName)) issues.push(issue(decision, "DECISION_SOURCE_IDENTITY_INVALID", "Stored normalized source identity does not match exact normalization."));
  if (!TOBACCO_IDENTITY_DECISION_STATUSES.includes(decision.decision.status)) issues.push(issue(decision, "DECISION_INVALID", "Unsupported decision status."));
  if (!TOBACCO_IDENTITY_REVIEW_STATES.includes(decision.review.state)) issues.push(issue(decision, "REVIEW_RECORD_INVALID", "Unsupported review state."));
  if (!PRODUCT_LINE_INTERPRETATIONS.includes(source.productLineInterpretation)) issues.push(issue(decision, "PRODUCT_LINE_UNCONFIRMED", "Unsupported product-line interpretation."));
  if ((source.sourcePriority === "P2" || source.sourcePriority === "P3") && decision.review.state === "CONFIRMED") issues.push(issue(decision, "P2_P3_DECISION_NOT_ALLOWED", "P2/P3 decisions cannot be applied in v0.3.2."));
  if (decision.review.state !== "CONFIRMED") issues.push(issue(decision, "DECISION_NOT_CONFIRMED", "Decision is stored for review but is not applicable.", "WARNING"));
  if (decision.review.state === "CONFIRMED" && decision.evidence.length === 0) issues.push(issue(decision, "DECISION_EVIDENCE_MISSING", "Confirmed decision requires evidence."));
  if (decision.review.state === "CONFIRMED" && decision.evidence.some(evidence => !evidence.confidence)) issues.push(issue(decision, "DECISION_CONFIDENCE_MISSING", "Confirmed decision requires confidence on every evidence item."));
  if (decision.evidence.some(evidence => !TOBACCO_IDENTITY_EVIDENCE_TYPES.includes(evidence.sourceType) || !present(evidence.sourceReference) || (!present(evidence.sourceUrl) && !present(evidence.internalReference)) || !present(evidence.checkedAt))) issues.push(issue(decision, "DECISION_EVIDENCE_MISSING", "Evidence type, reference, sourceUrl/internalReference and checkedAt are required."));
  const line = decision.decision.productLineId;
  if (line && FICTITIOUS_PRODUCT_LINES.has(normalizeDecisionText(line))) issues.push(issue(decision, "PRODUCT_LINE_FICTITIOUS", "Fictitious product lines default/unknown/main/base are forbidden."));
  if (source.productLineInterpretation === "AMBIGUOUS" && decision.decision.status === "RESOLVED") issues.push(issue(decision, "PRODUCT_LINE_AMBIGUOUS", "Ambiguous product line cannot produce RESOLVED decision."));
  if (decision.decision.status === "RESOLVED") {
    if (!present(decision.decision.manufacturerId) || !present(decision.decision.canonicalProductName) || !present(decision.decision.canonicalProductId)) issues.push(issue(decision, "DECISION_CANONICAL_ID_MISSING", "RESOLVED requires manufacturerId, canonicalProductName and canonicalProductId."));
    if (source.productLineInterpretation === "CONFIRMED" && !present(line)) issues.push(issue(decision, "PRODUCT_LINE_UNCONFIRMED", "CONFIRMED product line requires productLineId."));
    if (source.productLineInterpretation === "CONFIRMED_NONE" && line !== null) issues.push(issue(decision, "PRODUCT_LINE_UNCONFIRMED", "CONFIRMED_NONE requires nullable productLineId without a fictitious line."));
    if (source.productLineInterpretation === "UNKNOWN" || source.productLineInterpretation === "EMBEDDED_IN_MANUFACTURER" || source.productLineInterpretation === "EMBEDDED_IN_PRODUCT_NAME") issues.push(issue(decision, "PRODUCT_LINE_UNCONFIRMED", "Product-line interpretation requires manual confirmation before RESOLVED."));
    if (decision.decision.canonicalProductId && /[^\x00-\x7F]/.test(decision.decision.canonicalProductId)) issues.push(issue(decision, "CANONICAL_ID_NON_ASCII", "Canonical product ID must contain ASCII characters only."));
    else if (decision.decision.canonicalProductId && !ASCII_CANONICAL_PRODUCT_ID_PATTERN.test(decision.decision.canonicalProductId)) issues.push(issue(decision, "CANONICAL_ID_INVALID", "Canonical product ID must match the lowercase ASCII slug policy."));
    const expected = present(decision.decision.manufacturerId) && present(decision.decision.canonicalProductName) ? createCanonicalTobaccoProductId(decision.decision.manufacturerId, line, decision.decision.canonicalProductName) : null;
    if (decision.decision.canonicalProductId && decision.decision.canonicalProductId !== expected) issues.push(issue(decision, "CANONICAL_ID_INVALID", `Canonical ID must equal ${expected ?? "a valid deterministic ID"}.`));
  }
  if (decision.decision.status === "MANUFACTURER_ONLY") {
    if (!present(decision.decision.manufacturerId)) issues.push(issue(decision, "MANUFACTURER_CONFLICT", "MANUFACTURER_ONLY requires confirmed manufacturerId."));
    if (decision.decision.canonicalProductId !== null) issues.push(issue(decision, "DECISION_INVALID", "MANUFACTURER_ONLY must not create canonicalProductId."));
  }
  if (["UNRESOLVED", "AMBIGUOUS", "REJECTED"].includes(decision.decision.status) && decision.decision.canonicalProductId !== null) issues.push(issue(decision, "DECISION_INVALID", `${decision.decision.status} must not contain canonicalProductId.`));
  const errors = issues.filter(item => item.severity === "ERROR");
  return { valid: errors.length === 0, applicable: errors.length === 0 && decision.review.state === "CONFIRMED" && source.sourcePriority !== "P2" && source.sourcePriority !== "P3", issues };
};
