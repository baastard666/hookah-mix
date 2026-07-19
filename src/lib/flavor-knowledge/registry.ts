import { CATEGORY_RELATIONS } from "./category-relations";
import { KNOWLEDGE_CLAIMS, KNOWLEDGE_EVIDENCE } from "./evidence";
import { NOTE_KNOWLEDGE } from "./note-relations";
import { NOTE_TAXONOMY } from "./note-taxonomy";
import type { FlavorKnowledgeRegistry } from "./types";

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(nested => deepFreeze(nested));
  }
  return value;
};

export const FLAVOR_KNOWLEDGE_REGISTRY: FlavorKnowledgeRegistry = deepFreeze({
  categories: [...NOTE_TAXONOMY],
  categoryRelations: [...CATEGORY_RELATIONS],
  notes: [...NOTE_KNOWLEDGE],
  evidence: [...KNOWLEDGE_EVIDENCE],
  claims: [...KNOWLEDGE_CLAIMS],
});
