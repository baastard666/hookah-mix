import type { KnowledgeClaim, KnowledgeEvidence } from "./types";

export const KNOWLEDGE_EVIDENCE: readonly KnowledgeEvidence[] = [
  { id: "evidence.internal.rules", type: "INTERNAL_EXPERT_RULE", sourceName: "hookah-mix", reference: "knowledge-v1", weight: 0.65 },
  { id: "evidence.editorial.taxonomy", type: "EDITORIAL_RESEARCH", sourceName: "hookah-mix editorial", reference: "taxonomy-v1", weight: 0.72 },
  { id: "evidence.verified.core-pairs", type: "VERIFIED_TEST", sourceName: "hookah-mix fixtures", reference: "core-pairs-v1", weight: 0.9 },
  { id: "evidence.manufacturer.descriptions", type: "MANUFACTURER_DESCRIPTION", sourceName: "manufacturer descriptions", reference: "seed-descriptions-v1", weight: 0.55 },
  { id: "evidence.community.aggregate", type: "COMMUNITY_AGGREGATE", sourceName: "future aggregate fixture", reference: "aggregate-fixture-v1", weight: 0.6 },
  { id: "evidence.inferred.taxonomy", type: "INFERRED_RELATION", sourceName: "taxonomy inference", reference: "parent-child-v1", weight: 0.3 },
];

export const KNOWLEDGE_CLAIMS: readonly KnowledgeClaim[] = [
  { id: "claim.note.blueberry-category", subjectType: "NOTE", subjectIds: ["blueberry"], claimType: "HAS_CATEGORY", value: "BERRY", evidenceIds: ["evidence.editorial.taxonomy", "evidence.manufacturer.descriptions"] },
  { id: "claim.note.lavender-category", subjectType: "NOTE", subjectIds: ["lavender"], claimType: "HAS_CATEGORY", value: "FLORAL", evidenceIds: ["evidence.editorial.taxonomy", "evidence.inferred.taxonomy"] },
  { id: "claim.relation.berry-floral", subjectType: "CATEGORY_RELATION", subjectIds: ["BERRY", "FLORAL"], claimType: "USUALLY_MATCHES", value: "GOOD_MATCH", evidenceIds: ["evidence.internal.rules", "evidence.verified.core-pairs"] },
  { id: "claim.relation.coffee-creamy", subjectType: "CATEGORY_RELATION", subjectIds: ["COFFEE", "CREAMY"], claimType: "USUALLY_MATCHES", value: "STRONG_MATCH", evidenceIds: ["evidence.internal.rules", "evidence.verified.core-pairs", "evidence.editorial.taxonomy"] },
  { id: "claim.relation.coffee-citrus", subjectType: "CATEGORY_RELATION", subjectIds: ["COFFEE", "CITRUS"], claimType: "HAS_RISK", value: "RISKY", evidenceIds: ["evidence.internal.rules"] },
  { id: "claim.relation.candy-smoky", subjectType: "CATEGORY_RELATION", subjectIds: ["CANDY", "SMOKY"], claimType: "HAS_CONFLICT", value: "CONFLICT", evidenceIds: ["evidence.internal.rules", "evidence.inferred.taxonomy"] },
  { id: "claim.note.mint-cooling", subjectType: "NOTE_RELATION", subjectIds: ["mint", "cooling"], claimType: "RELATED", value: true, evidenceIds: ["evidence.inferred.taxonomy"] },
];
