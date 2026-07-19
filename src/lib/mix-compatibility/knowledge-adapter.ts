import type { FlavorNoteCategory as LegacyFlavorNoteCategory } from "../flavors/types";
import { getCategoryRelation, toKnowledgeCategory } from "../flavor-knowledge";
import type { NoteCompatibilityRule, RuleType } from "./types";

const toRuleType = (type: ReturnType<typeof getCategoryRelation>["type"]): RuleType => {
  if (type === "CONFLICT") return "conflict";
  if (type === "RISKY") return "caution";
  return "positive";
};

export const getKnowledgeRelationForLegacyCategories = (
  left: LegacyFlavorNoteCategory,
  right: LegacyFlavorNoteCategory,
) => {
  const knowledgeLeft = toKnowledgeCategory(left);
  const knowledgeRight = toKnowledgeCategory(right);
  return knowledgeLeft && knowledgeRight ? getCategoryRelation(knowledgeLeft, knowledgeRight) : undefined;
};

export const createKnowledgeCategoryRule = (
  left: LegacyFlavorNoteCategory,
  right: LegacyFlavorNoteCategory,
): NoteCompatibilityRule => {
  const relation = getKnowledgeRelationForLegacyCategories(left, right);
  if (!relation || relation.type === "NEUTRAL") throw new Error(`No knowledge relation for ${left} + ${right}`);
  return {
    id: relation.ruleId,
    type: toRuleType(relation.type),
    left: { categories: [left] },
    right: { categories: [right] },
    weight: relation.baseScore,
    title: relation.ruleId,
    technicalDescription: `Knowledge Layer relation ${relation.ruleId}`,
    explanation: `Category relation ${relation.type}`,
  };
};
