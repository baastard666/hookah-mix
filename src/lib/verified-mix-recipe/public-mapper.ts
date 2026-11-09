import { deepCloneAndFreeze } from "../expert-mix-knowledge/normalizer";
import type { PublicVerifiedMixRecipe, VerifiedMixRecipe } from "./types";

// sourceRecordId links the internal provenance layer and is deliberately absent from the public DTO.
export const mapVerifiedMixRecipeToPublic = (recipe: VerifiedMixRecipe): PublicVerifiedMixRecipe => {
  const { sourceRecordId: _sourceRecordId, ...publicRecipe } = recipe;
  void _sourceRecordId;
  return deepCloneAndFreeze(publicRecipe);
};

export const auditPublicVerifiedMixRecipes = (recipes: readonly PublicVerifiedMixRecipe[], forbiddenTokens: readonly string[] = []): readonly string[] => {
  const serialized = JSON.stringify(recipes);
  const forbiddenFields = ["sourceRecordId", "sourceId", "evidenceId", "excerpt", "internalLabel", "reviewerNotes", "workbookPath", "sourceRow", "privateUrl"];
  return Object.freeze([...forbiddenFields, ...forbiddenTokens].filter(token => serialized.includes(token)).sort((left, right) => left.localeCompare(right, "en")));
};
