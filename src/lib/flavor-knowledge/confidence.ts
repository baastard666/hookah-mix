import { CONFIDENCE_WEIGHTS, round } from "./constants";
import type { KnowledgeConfidence, KnowledgeConfidenceReason, KnowledgeEvidence } from "./types";
import { KnowledgeValidationError, validateEvidence } from "./validation";

const evidenceSourceKey = (item: KnowledgeEvidence): string =>
  [item.type, item.sourceName?.trim().toLowerCase() ?? "", item.reference?.trim().toLowerCase() ?? ""].join("::");

export const calculateKnowledgeConfidence = (evidence: readonly KnowledgeEvidence[]): KnowledgeConfidence => {
  const invalid = evidence.flatMap(item => validateEvidence(item).errors);
  if (invalid.length) throw new KnowledgeValidationError("Invalid evidence", invalid);
  if (evidence.length === 0) return { score: 0, level: "LOW", evidenceCount: 0, sourceDiversity: 0, reasons: [{ code: "NO_EVIDENCE", impact: 0, description: "The claim has no evidence" }] };

  const uniqueBySource = new Map<string, KnowledgeEvidence>();
  evidence.forEach(item => {
    const key = evidenceSourceKey(item);
    const current = uniqueBySource.get(key);
    if (!current || item.weight > current.weight) uniqueBySource.set(key, item);
  });
  const unique = [...uniqueBySource.values()].sort((a, b) => a.id.localeCompare(b.id, "en"));
  const types = new Set(unique.map(item => item.type));
  const averageWeight = unique.reduce((sum, item) => sum + item.weight, 0) / unique.length;
  const reasons: KnowledgeConfidenceReason[] = [];
  let score = averageWeight * CONFIDENCE_WEIGHTS.averageEvidenceWeight;
  reasons.push({ code: "AVERAGE_WEIGHT", impact: round(score), description: "Average weight of independent evidence" });

  const countBonus = Math.min((unique.length - 1) * CONFIDENCE_WEIGHTS.additionalEvidence, CONFIDENCE_WEIGHTS.maxAdditionalEvidenceBonus);
  if (countBonus) { score += countBonus; reasons.push({ code: "MULTIPLE_SOURCES", impact: countBonus, description: "Multiple independent evidence sources" }); }
  const diversityBonus = Math.min((types.size - 1) * CONFIDENCE_WEIGHTS.additionalSourceType, CONFIDENCE_WEIGHTS.maxSourceDiversityBonus);
  if (diversityBonus) { score += diversityBonus; reasons.push({ code: "SOURCE_DIVERSITY", impact: diversityBonus, description: "Different evidence types support the claim" }); }
  if (types.has("VERIFIED_TEST")) { score += CONFIDENCE_WEIGHTS.verifiedTestBonus; reasons.push({ code: "VERIFIED_TEST", impact: CONFIDENCE_WEIGHTS.verifiedTestBonus, description: "A verified test supports the claim" }); }

  if (types.size === 1 && types.has("INFERRED_RELATION")) score = Math.min(score, CONFIDENCE_WEIGHTS.inferredOnlyCap);
  if (unique.length === 1 && types.has("INTERNAL_EXPERT_RULE")) score = Math.min(score, CONFIDENCE_WEIGHTS.singleExpertCap);
  if (types.size === 1 && types.has("MANUFACTURER_DESCRIPTION")) score = Math.min(score, CONFIDENCE_WEIGHTS.manufacturerOnlyCap);
  if (types.size === 1 && types.has("COMMUNITY_AGGREGATE")) score = Math.min(score, CONFIDENCE_WEIGHTS.communityOnlyCap);
  if (unique.length < evidence.length) reasons.push({ code: "DUPLICATES_IGNORED", impact: 0, description: "Duplicate sources were counted once" });

  const finalScore = Math.max(0, Math.min(100, round(score)));
  const level = finalScore <= CONFIDENCE_WEIGHTS.lowMaximum ? "LOW" : finalScore <= CONFIDENCE_WEIGHTS.mediumMaximum ? "MEDIUM" : "HIGH";
  return { score: finalScore, level, evidenceCount: unique.length, sourceDiversity: types.size, reasons };
};
