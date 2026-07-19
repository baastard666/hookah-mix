import { DEFAULT_NEUTRAL_RELATION_SCORE, normalizePairKey } from "./constants";
import { calculateKnowledgeConfidence } from "./confidence";
import { FLAVOR_KNOWLEDGE_REGISTRY } from "./registry";
import type { FlavorCategoryRelation, FlavorKnowledgeRegistry, FlavorNoteCategory, KnowledgeClaim, KnowledgeConfidence } from "./types";
import { KnowledgeValidationError } from "./validation";

const byId = (left: { id?: string; noteId?: string }, right: { id?: string; noteId?: string }): number =>
  (left.id ?? left.noteId ?? "").localeCompare(right.id ?? right.noteId ?? "", "en");
const normalizeAlias = (value: string): string => value.trim().toLocaleLowerCase("en-US");

export const getCategoryDefinition = (category: FlavorNoteCategory, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY) =>
  registry.categories.find(item => item.id === category);

export const getParentCategory = (category: FlavorNoteCategory, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY) => {
  const parentId = getCategoryDefinition(category, registry)?.parentId;
  return parentId ? getCategoryDefinition(parentId, registry) : undefined;
};

export const getChildCategories = (category: FlavorNoteCategory, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY) =>
  registry.categories.filter(item => item.parentId === category).sort(byId);

export const getRelatedCategories = (category: FlavorNoteCategory, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY) => {
  const definition = getCategoryDefinition(category, registry);
  if (!definition) return [];
  const ids = new Set<FlavorNoteCategory>(definition.relatedCategoryIds);
  if (definition.parentId) ids.add(definition.parentId);
  getChildCategories(category, registry).forEach(item => ids.add(item.id));
  registry.categories.forEach(item => { if (item.relatedCategoryIds.includes(category)) ids.add(item.id); });
  return [...ids].map(id => getCategoryDefinition(id, registry)).filter((item): item is NonNullable<typeof item> => Boolean(item)).sort(byId);
};

export const isSameCategory = (left: FlavorNoteCategory, right: FlavorNoteCategory): boolean => left === right;
export const isParentCategory = (parent: FlavorNoteCategory, child: FlavorNoteCategory, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY): boolean => getCategoryDefinition(child, registry)?.parentId === parent;
export const areRelatedCategories = (left: FlavorNoteCategory, right: FlavorNoteCategory, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY): boolean =>
  left === right || isParentCategory(left, right, registry) || isParentCategory(right, left, registry) || getRelatedCategories(left, registry).some(item => item.id === right);

export const getCategoryRelation = (left: FlavorNoteCategory, right: FlavorNoteCategory, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY): FlavorCategoryRelation => {
  const key = normalizePairKey(left, right);
  return registry.categoryRelations.find(item => normalizePairKey(item.left, item.right) === key) ?? {
    left: [left, right].sort((a, b) => a.localeCompare(b, "en"))[0],
    right: [left, right].sort((a, b) => a.localeCompare(b, "en"))[1],
    type: "NEUTRAL", baseScore: DEFAULT_NEUTRAL_RELATION_SCORE, ruleId: `category.neutral.${key.replace("::", "-").toLowerCase()}`, evidenceIds: [],
  };
};
export const getCategoryRelationScore = (left: FlavorNoteCategory, right: FlavorNoteCategory, registry?: FlavorKnowledgeRegistry): number => getCategoryRelation(left, right, registry).baseScore;

export const getNoteKnowledge = (noteId: string, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY) => registry.notes.find(item => item.noteId === noteId);
export const findNoteByAlias = (alias: string, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY) => {
  const normalized = normalizeAlias(alias);
  return registry.notes.find(item => item.aliases.some(value => normalizeAlias(value) === normalized));
};
export const getNoteCategories = (noteId: string, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY) => [...(getNoteKnowledge(noteId, registry)?.categoryIds ?? [])];
export const getRelatedNotes = (noteId: string, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY) => {
  const ids = new Set(getNoteKnowledge(noteId, registry)?.relatedNoteIds ?? []);
  registry.notes.forEach(item => { if (item.relatedNoteIds.includes(noteId)) ids.add(item.noteId); });
  return [...ids].map(id => getNoteKnowledge(id, registry)).filter((item): item is NonNullable<typeof item> => Boolean(item)).sort(byId);
};
export const areNotesRelated = (left: string, right: string, registry?: FlavorKnowledgeRegistry): boolean => getRelatedNotes(left, registry).some(item => item.noteId === right);

export const getEvidence = (evidenceId: string, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY) => registry.evidence.find(item => item.id === evidenceId);
export const getClaim = (claimId: string, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY): KnowledgeClaim | undefined => registry.claims.find(item => item.id === claimId);
export const getClaimsForSubject = (subjectId: string, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY) => registry.claims.filter(item => item.subjectIds.includes(subjectId)).sort(byId);
export const calculateKnowledgeConfidenceForClaim = (claimId: string, registry: FlavorKnowledgeRegistry = FLAVOR_KNOWLEDGE_REGISTRY): KnowledgeConfidence => {
  const claim = getClaim(claimId, registry);
  if (!claim) throw new KnowledgeValidationError(`Unknown claim: ${claimId}`);
  const evidence = claim.evidenceIds.map(id => getEvidence(id, registry));
  if (evidence.some(item => !item)) throw new KnowledgeValidationError(`Claim ${claimId} contains unknown evidence`);
  return calculateKnowledgeConfidence(evidence.filter((item): item is NonNullable<typeof item> => Boolean(item)));
};
