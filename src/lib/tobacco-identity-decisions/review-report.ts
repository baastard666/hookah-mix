import type { UnresolvedIdentityGroup, UnresolvedIdentityReport } from "../expert-mix-knowledge-import";
import { deepFreezeClone, normalizeDecisionText } from "./normalization";
import type { TobaccoIdentityDecision, TobaccoIdentityReviewPlan, TobaccoIdentityReviewRecord, TobaccoIdentitySourcePriority } from "./types";
import { TobaccoIdentityDecisionError } from "./errors";
import { hasManufacturerProfile } from "../tobacco-profile";

const userPrioritySpecs = [
  { manufacturer: "DARKSIDE", productName: "Черника-сирень" },
  { manufacturer: "Хулиган", productName: "Цветочная малина" },
  { manufacturer: "Dogma", productName: "Крымская лаванда" },
] as const;
const toReview = (group: UnresolvedIdentityGroup, priority: TobaccoIdentitySourcePriority = group.priority): TobaccoIdentityReviewRecord => ({
  groupId: group.groupId, priority, manufacturer: group.displayIdentity.manufacturer, productLine: group.displayIdentity.productLine, productName: group.displayIdentity.productName,
  normalizedManufacturer: group.normalizedIdentity.manufacturer, normalizedProductLine: group.normalizedIdentity.productLine, normalizedProductName: group.normalizedIdentity.productName,
  occurrenceCount: group.occurrenceCount, componentOccurrenceCount: group.componentOccurrenceCount, verifiedMixCount: group.verifiedMixCount,
  currentStatus: group.currentStatus, manufacturerKnown: group.manufacturerKnown, productLineKnown: group.productLineKnown,
  exactAliasCandidates: group.exactAliasCandidates.map(candidate => `${candidate.kind}:${candidate.registryId}:${candidate.matchedAlias}`), missingFields: group.missingFields,
  productLineInterpretation: "UNKNOWN", proposedDecisionStatus: group.currentStatus === "MANUFACTURER_ONLY" ? "MANUFACTURER_ONLY" : "UNRESOLVED",
  canonicalManufacturerId: null, canonicalProductLineId: null, canonicalProductId: null, canonicalProductName: null, aliases: [],
  evidenceType: null, evidenceReference: null, evidenceCheckedAt: null, evidencePublicSafe: false, confidence: null, reviewerNotes: null, reviewedAt: null, decisionState: "UNREVIEWED",
});
const syntheticUserPriority = (manufacturer: string, productName: string, index: number): TobaccoIdentityReviewRecord => ({
  groupId: `user-priority-${String(index + 1).padStart(2, "0")}`, priority: "USER_PRIORITY", manufacturer, productLine: null, productName,
  normalizedManufacturer: normalizeDecisionText(manufacturer), normalizedProductLine: "", normalizedProductName: normalizeDecisionText(productName),
  occurrenceCount: 0, componentOccurrenceCount: 0, verifiedMixCount: 0, currentStatus: "UNRESOLVED", manufacturerKnown: hasManufacturerProfile(manufacturer), productLineKnown: false,
  exactAliasCandidates: [], missingFields: ["productLine"], productLineInterpretation: "UNKNOWN", proposedDecisionStatus: "UNRESOLVED",
  canonicalManufacturerId: null, canonicalProductLineId: null, canonicalProductId: null, canonicalProductName: null, aliases: [], evidenceType: null, evidenceReference: null,
  evidenceCheckedAt: null, evidencePublicSafe: false, confidence: null, reviewerNotes: null, reviewedAt: null, decisionState: "UNREVIEWED",
});

export const createTobaccoIdentityReviewPlan = (report: UnresolvedIdentityReport): TobaccoIdentityReviewPlan => {
  const p1 = report.groups.filter(group => group.priority === "P1");
  const p0 = report.groups.filter(group => group.priority === "P0");
  const p0MultipleMixes = p0.filter(group => group.verifiedMixCount > 1);
  const p0Frequent = p0.filter(group => group.verifiedMixCount <= 1 && group.occurrenceCount > 2);
  const p0Rest = p0.filter(group => group.verifiedMixCount <= 1 && group.occurrenceCount <= 2);
  const records = [...p1, ...p0MultipleMixes, ...p0Frequent, ...p0Rest].map(group => toReview(group));
  const userPriority = userPrioritySpecs.map((spec, index) => {
    const match = [...p1, ...p0].find(group => group.normalizedIdentity.manufacturer === normalizeDecisionText(spec.manufacturer) && group.normalizedIdentity.productName === normalizeDecisionText(spec.productName));
    return match ? toReview(match, "USER_PRIORITY") : syntheticUserPriority(spec.manufacturer, spec.productName, index);
  });
  const all = [...records, ...userPriority];
  return deepFreezeClone({ version: "tobacco-identity-review-v1", records, userPriority, counts: { p0: p0.length, p1: p1.length, userPriority: userPriority.length, unreviewed: all.filter(item => item.decisionState === "UNREVIEWED").length, confirmed: all.filter(item => item.decisionState === "CONFIRMED").length } }) as TobaccoIdentityReviewPlan;
};

export const reviewRecordToDecision = (record: TobaccoIdentityReviewRecord): TobaccoIdentityDecision => ({
  id: `decision-${record.groupId}`,
  sourceIdentity: { manufacturer: record.manufacturer, productLine: record.productLine, productName: record.productName, normalizedManufacturer: record.normalizedManufacturer, normalizedProductLine: record.normalizedProductLine, normalizedProductName: record.normalizedProductName, sourceGroupId: record.groupId, sourcePriority: record.priority, sourceSheets: record.componentOccurrenceCount > 0 ? ["Mix_Components", ...(record.occurrenceCount > record.componentOccurrenceCount ? ["ОСНОВНАЯ_БАЗА"] : [])] : ["ОСНОВНАЯ_БАЗА"], sourceRows: [], productLineInterpretation: record.productLineInterpretation },
  decision: { status: record.proposedDecisionStatus, manufacturerId: record.canonicalManufacturerId, productLineId: record.canonicalProductLineId, canonicalProductId: record.canonicalProductId, canonicalManufacturerName: record.manufacturer, canonicalProductLineName: record.productLine, canonicalProductName: record.canonicalProductName, aliases: record.aliases },
  evidence: record.evidenceType && record.evidenceReference && record.evidenceCheckedAt && record.confidence ? [{ sourceType: record.evidenceType, sourceReference: record.evidenceReference, ...(record.evidencePublicSafe ? { sourceUrl: record.evidenceReference } : { internalReference: record.evidenceReference }), confidence: record.confidence, checkedAt: record.evidenceCheckedAt, publicSafe: record.evidencePublicSafe }] : [],
  review: { state: record.decisionState, reviewedByType: null, reviewedAt: record.reviewedAt, reviewerNotes: record.reviewerNotes },
  metadata: { version: "tobacco-identity-decision-v1", createdAt: null, updatedAt: null },
});
export const reviewPlanToJson = (plan: TobaccoIdentityReviewPlan): string => `${JSON.stringify(plan, null, 2)}\n`;
export const parseTobaccoIdentityReviewPlanJson = (text: string): TobaccoIdentityReviewPlan => {
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new TobaccoIdentityDecisionError("Review JSON is invalid.", [{ code: "REVIEW_RECORD_INVALID", severity: "ERROR", message: "Review file is not valid JSON." }]); }
  if (value === null || typeof value !== "object" || (value as { version?: unknown }).version !== "tobacco-identity-review-v1" || !Array.isArray((value as { records?: unknown }).records) || !Array.isArray((value as { userPriority?: unknown }).userPriority)) throw new TobaccoIdentityDecisionError("Review plan is invalid.", [{ code: "REVIEW_RECORD_INVALID", severity: "ERROR", message: "Review plan version or record arrays are invalid." }]);
  return deepFreezeClone(value as TobaccoIdentityReviewPlan) as TobaccoIdentityReviewPlan;
};
const csvCell = (value: unknown): string => `"${(Array.isArray(value) ? value.join("; ") : value ?? "").toString().replaceAll('"', '""')}"`;
export const reviewPlanToCsv = (plan: TobaccoIdentityReviewPlan): string => {
  const records = [...plan.records, ...plan.userPriority];
  const headers = ["groupId", "priority", "manufacturer", "productLine", "productName", "normalizedManufacturer", "normalizedProductLine", "normalizedProductName", "occurrenceCount", "componentOccurrenceCount", "verifiedMixCount", "currentStatus", "manufacturerKnown", "productLineKnown", "exactAliasCandidates", "missingFields", "productLineInterpretation", "proposedDecisionStatus", "canonicalManufacturerId", "canonicalProductLineId", "canonicalProductId", "canonicalProductName", "aliases", "evidenceType", "evidenceReference", "evidenceCheckedAt", "evidencePublicSafe", "confidence", "reviewerNotes", "reviewedAt", "decisionState"] as const;
  return `${headers.map(csvCell).join(",")}\n${records.map(record => headers.map(header => csvCell(record[header])).join(",")).join("\n")}\n`;
};
const markdownTable = (records: readonly TobaccoIdentityReviewRecord[]): string => [
  "| groupId | priority | manufacturer | productLine | productName | occurrences | VERIFIED | status | Registry manufacturer/line | line interpretation | proposed | canonical IDs | evidence | confidence | state |",
  "|---|---|---|---|---|---:|---:|---|---|---|---|---|---|---|---|",
  ...records.map(record => `| ${record.groupId} | ${record.priority} | ${record.manufacturer ?? "—"} | ${record.productLine ?? "—"} | ${record.productName ?? "—"} | ${record.occurrenceCount} | ${record.verifiedMixCount} | ${record.currentStatus} | ${record.manufacturerKnown ? "yes" : "no"}/${record.productLineKnown ? "yes" : "no"} | ${record.productLineInterpretation} | ${record.proposedDecisionStatus} | ${record.canonicalManufacturerId ?? "—"} / ${record.canonicalProductLineId ?? "—"} / ${record.canonicalProductId ?? "—"} | ${record.evidenceType ?? "—"}: ${record.evidenceReference ?? "—"} | ${record.confidence ?? "—"} | ${record.decisionState} |`),
].join("\n");
export const reviewPlanToMarkdown = (plan: TobaccoIdentityReviewPlan): string => ["# Tobacco identity review — P0/P1", "", "Заполняется вручную. Canonical IDs не назначены автоматически. P2/P3 исключены.", "", `P1: ${plan.counts.p1}; P0: ${plan.counts.p0}; USER_PRIORITY: ${plan.counts.userPriority}.`, "", "## Review queue", "", markdownTable(plan.records), "", "## USER_PRIORITY", "", markdownTable(plan.userPriority), ""].join("\n");
