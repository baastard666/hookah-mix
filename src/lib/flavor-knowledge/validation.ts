import { CLAIM_SUBJECT_TYPES, EVIDENCE_TYPES, FLAVOR_NOTE_CATEGORIES, RELATION_TYPES, normalizePairKey } from "./constants";
import type { FlavorKnowledgeRegistry, FlavorNoteCategory, KnowledgeEvidence, KnowledgeValidationResult } from "./types";

export class KnowledgeValidationError extends Error {
  readonly issues: readonly string[];
  constructor(message: string, issues: readonly string[] = [message]) {
    super(message);
    this.name = "KnowledgeValidationError";
    this.issues = [...issues];
  }
}

const duplicates = (values: readonly string[]): string[] => {
  const seen = new Set<string>();
  return values.filter(value => seen.has(value) || (seen.add(value), false));
};

export const validateEvidence = (evidence: KnowledgeEvidence): KnowledgeValidationResult => {
  const errors: string[] = [];
  if (!evidence.id.trim()) errors.push("Evidence id must not be empty");
  if (!EVIDENCE_TYPES.includes(evidence.type)) errors.push(`Unknown evidence type: ${evidence.type}`);
  if (!Number.isFinite(evidence.weight) || evidence.weight < 0 || evidence.weight > 1) errors.push(`Evidence ${evidence.id} weight must be between 0 and 1`);
  return { success: errors.length === 0, errors };
};

export const validateKnowledgeRegistry = (registry: FlavorKnowledgeRegistry): KnowledgeValidationResult => {
  const errors: string[] = [];
  const categoryIds = new Set(registry.categories.map(item => item.id));
  const noteIds = new Set(registry.notes.map(item => item.noteId));
  const evidenceIds = new Set(registry.evidence.map(item => item.id));

  for (const [kind, ids] of [
    ["category", registry.categories.map(item => item.id)],
    ["note", registry.notes.map(item => item.noteId)],
    ["evidence", registry.evidence.map(item => item.id)],
    ["claim", registry.claims.map(item => item.id)],
  ] as const) {
    duplicates(ids).forEach(id => errors.push(`Duplicate ${kind} id: ${id}`));
  }

  registry.categories.forEach(item => {
    if (!FLAVOR_NOTE_CATEGORIES.includes(item.id)) errors.push(`Unknown category id: ${item.id}`);
    if (item.parentId && !categoryIds.has(item.parentId)) errors.push(`Unknown parent category ${item.parentId} for ${item.id}`);
    item.relatedCategoryIds.forEach(id => { if (!categoryIds.has(id)) errors.push(`Unknown related category ${id} for ${item.id}`); });
  });

  registry.categories.forEach(item => {
    const visited = new Set<string>([item.id]);
    let parentId = item.parentId;
    while (parentId) {
      if (visited.has(parentId)) { errors.push(`Cyclic parent relation at ${item.id}`); break; }
      visited.add(parentId);
      parentId = registry.categories.find(candidate => candidate.id === parentId)?.parentId;
    }
  });

  const pairKeys = registry.categoryRelations.map(item => normalizePairKey(item.left, item.right));
  duplicates(pairKeys).forEach(id => errors.push(`Duplicate category relation: ${id}`));
  duplicates(registry.categoryRelations.map(item => item.ruleId)).forEach(id => errors.push(`Duplicate relation ruleId: ${id}`));
  registry.categoryRelations.forEach(item => {
    if (!categoryIds.has(item.left) || !categoryIds.has(item.right)) errors.push(`Unknown category in relation ${item.ruleId}`);
    if (!RELATION_TYPES.includes(item.type)) errors.push(`Unknown relation type in ${item.ruleId}`);
    if (!Number.isFinite(item.baseScore) || item.baseScore < -1 || item.baseScore > 1) errors.push(`Invalid baseScore in ${item.ruleId}`);
    item.evidenceIds.forEach(id => { if (!evidenceIds.has(id)) errors.push(`Unknown evidence ${id} in relation ${item.ruleId}`); });
  });

  registry.evidence.forEach(item => errors.push(...validateEvidence(item).errors));
  registry.notes.forEach(item => {
    if (!item.noteId.trim()) errors.push("Note id must not be empty");
    item.categoryIds.forEach(id => { if (!categoryIds.has(id)) errors.push(`Unknown category ${id} in note ${item.noteId}`); });
    item.relatedNoteIds.forEach(id => { if (!noteIds.has(id)) errors.push(`Unknown related note ${id} in ${item.noteId}`); });
    item.evidenceIds.forEach(id => { if (!evidenceIds.has(id)) errors.push(`Unknown evidence ${id} in note ${item.noteId}`); });
  });

  registry.claims.forEach(claim => {
    if (!CLAIM_SUBJECT_TYPES.includes(claim.subjectType)) errors.push(`Unknown claim subject type in ${claim.id}`);
    if (claim.subjectIds.length === 0 || claim.subjectIds.some(id => !id.trim())) errors.push(`Claim ${claim.id} must have non-empty subjectIds`);
    const subjects = claim.subjectType === "CATEGORY" || claim.subjectType === "CATEGORY_RELATION" ? categoryIds : noteIds;
    claim.subjectIds.forEach(id => { if (!subjects.has(id)) errors.push(`Unknown subject ${id} in claim ${claim.id}`); });
    claim.evidenceIds.forEach(id => { if (!evidenceIds.has(id)) errors.push(`Unknown evidence ${id} in claim ${claim.id}`); });
    if (claim.claimType === "HAS_CATEGORY" && typeof claim.value === "string" && !categoryIds.has(claim.value as FlavorNoteCategory)) errors.push(`Unknown category value ${claim.value} in claim ${claim.id}`);
  });

  return { success: errors.length === 0, errors: [...new Set(errors)].sort((a, b) => a.localeCompare(b, "en")) };
};

export const assertValidKnowledgeRegistry = (registry: FlavorKnowledgeRegistry): void => {
  const result = validateKnowledgeRegistry(registry);
  if (!result.success) throw new KnowledgeValidationError("Flavor knowledge registry is invalid", result.errors);
};
