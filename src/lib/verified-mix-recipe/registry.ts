import { normalizeExpertKnowledgeTag } from "../expert-mix-knowledge";
import { deepCloneAndFreeze } from "../expert-mix-knowledge/normalizer";
import type { ExpertMixKnowledgeRecord } from "../expert-mix-knowledge";
import type { TobaccoIdentityDecisionRegistry } from "../tobacco-identity-decisions";
import { createVerifiedMixRecipeAudit } from "./audit";
import { evaluateVerifiedMixRecipeEligibility } from "./eligibility";
import { VerifiedMixRecipeRegistryError } from "./errors";
import { normalizeVerifiedMixRecipe } from "./normalizer";
import { validateVerifiedMixRecipes } from "./validation";
import type { VerifiedMixRecipe, VerifiedMixRecipeRegistry } from "./types";

const ordered = (recipes: readonly VerifiedMixRecipe[]): readonly VerifiedMixRecipe[] => [...recipes].sort((left, right) => left.recipeId.localeCompare(right.recipeId, "en"));
const copy = (recipe: VerifiedMixRecipe): Readonly<VerifiedMixRecipe> => deepCloneAndFreeze(recipe);

export const createVerifiedMixRecipeRegistry = (
  records: readonly ExpertMixKnowledgeRecord[],
  decisions: TobaccoIdentityDecisionRegistry,
): VerifiedMixRecipeRegistry => {
  const recipes: VerifiedMixRecipe[] = [];
  for (const record of records) {
    const eligibility = evaluateVerifiedMixRecipeEligibility(record, decisions);
    if (eligibility.eligible) recipes.push(normalizeVerifiedMixRecipe(record));
  }
  const sorted = ordered(recipes);
  const validationIssues = validateVerifiedMixRecipes(sorted, decisions);
  if (validationIssues.length > 0) throw new VerifiedMixRecipeRegistryError("Реестр проверенных рецептов не прошёл валидацию.", validationIssues);
  const internal = deepCloneAndFreeze(sorted) as readonly VerifiedMixRecipe[];
  const byId = new Map(internal.map(recipe => [recipe.recipeId, recipe]));
  const registry: VerifiedMixRecipeRegistry = {
    version: "verified-mix-recipe-registry-v1",
    size: internal.length,
    audit: deepCloneAndFreeze(createVerifiedMixRecipeAudit(records, internal, decisions, validationIssues)),
    get: recipeId => {
      const recipe = byId.get(recipeId);
      return recipe ? copy(recipe) : null;
    },
    has: recipeId => byId.has(recipeId),
    list: () => internal.map(copy),
    findByProductId: canonicalProductId => internal.filter(recipe => recipe.components.some(component => component.canonicalProductId === canonicalProductId)).map(copy),
    findByTag: tag => {
      const normalized = normalizeExpertKnowledgeTag(tag);
      return internal.filter(recipe => recipe.tags.some(recipeTag => normalizeExpertKnowledgeTag(recipeTag) === normalized)).map(copy);
    },
    // Empty input deliberately returns no recipes: it is a strict "contains all requested" query,
    // not a shorthand for listing the registry.
    findContainingProducts: canonicalProductIds => {
      const requested = [...new Set(canonicalProductIds.filter(id => id.trim().length > 0))];
      if (requested.length === 0) return [];
      return internal.filter(recipe => {
        const available = new Set(recipe.components.map(component => component.canonicalProductId));
        return requested.every(id => available.has(id));
      }).map(copy);
    },
  };
  return Object.freeze(registry);
};

export const getVerifiedMixRecipe = (registry: VerifiedMixRecipeRegistry, recipeId: string) => registry.get(recipeId);
export const hasVerifiedMixRecipe = (registry: VerifiedMixRecipeRegistry, recipeId: string) => registry.has(recipeId);
export const listVerifiedMixRecipes = (registry: VerifiedMixRecipeRegistry) => registry.list();
export const findVerifiedMixRecipesByProductId = (registry: VerifiedMixRecipeRegistry, canonicalProductId: string) => registry.findByProductId(canonicalProductId);
export const findVerifiedMixRecipesByTag = (registry: VerifiedMixRecipeRegistry, tag: string) => registry.findByTag(tag);
export const findVerifiedMixRecipesContainingProducts = (registry: VerifiedMixRecipeRegistry, canonicalProductIds: readonly string[]) => registry.findContainingProducts(canonicalProductIds);
