export { FLAVOR_NOTE_CATEGORIES, KNOWLEDGE_VERSION } from "./constants";
export { FLAVOR_KNOWLEDGE_REGISTRY } from "./registry";
export { toKnowledgeCategory, toLegacyCategory } from "./note-taxonomy";
export { calculateKnowledgeConfidence } from "./confidence";
export { assertValidKnowledgeRegistry, validateEvidence, validateKnowledgeRegistry, KnowledgeValidationError } from "./validation";
export {
  areNotesRelated, areRelatedCategories, calculateKnowledgeConfidenceForClaim, findNoteByAlias,
  getCategoryDefinition, getCategoryRelation, getCategoryRelationScore, getChildCategories,
  getClaim, getClaimsForSubject, getEvidence, getNoteCategories, getNoteKnowledge,
  getParentCategory, getRelatedCategories, getRelatedNotes, isParentCategory, isSameCategory,
} from "./queries";
export type {
  FlavorCategoryRelation, FlavorCategoryRelationType, FlavorKnowledgeRegistry, FlavorNoteCategory,
  FlavorNoteCategoryDefinition, FlavorNoteKnowledge, KnowledgeClaim, KnowledgeClaimSubjectType,
  KnowledgeConfidence, KnowledgeConfidenceReason, KnowledgeEvidence, KnowledgeEvidenceType,
  KnowledgeExplanationReference, KnowledgeValidationResult,
} from "./types";
