import type { TobaccoIdentityDecisionRegistry } from "../tobacco-identity-decisions";
import { VERIFIED_MIX_RECIPE_PERCENT_EPSILON } from "./constants";
import type { VerifiedMixRecipe, VerifiedMixRecipeValidationIssue } from "./types";

export const validateVerifiedMixRecipes = (recipes: readonly VerifiedMixRecipe[], decisions: TobaccoIdentityDecisionRegistry): readonly VerifiedMixRecipeValidationIssue[] => {
  const issues: VerifiedMixRecipeValidationIssue[] = [];
  const ids = new Set<string>();
  for (const recipe of recipes) {
    if (ids.has(recipe.recipeId)) issues.push({ code: "DUPLICATE_RECIPE_ID", recipeId: recipe.recipeId, message: "recipeId повторяется." });
    ids.add(recipe.recipeId);
    if (recipe.components.length < 2 || Math.abs(recipe.totalPercentage - 100) > VERIFIED_MIX_RECIPE_PERCENT_EPSILON || recipe.components.some(component => !Number.isFinite(component.percentage) || component.percentage <= 0 || component.percentage > 100)) issues.push({ code: "INVALID_RECIPE", recipeId: recipe.recipeId, message: "Рецепт не содержит корректных точных процентов." });
    const canonicalIds = recipe.components.map(component => component.canonicalProductId);
    if (new Set(canonicalIds).size !== canonicalIds.length) issues.push({ code: "DUPLICATE_CANONICAL_COMPONENT", recipeId: recipe.recipeId, message: "В рецепте повторяется canonicalProductId." });
    for (const canonicalProductId of canonicalIds) {
      const lookup = decisions.getByCanonicalProductId(canonicalProductId);
      if (lookup.status === "NOT_FOUND") issues.push({ code: "CANONICAL_PRODUCT_NOT_FOUND", recipeId: recipe.recipeId, message: `Не найден ${canonicalProductId}.` });
      else if (lookup.status === "FOUND" && lookup.decision.decision.status !== "RESOLVED") issues.push({ code: "CANONICAL_PRODUCT_NOT_RESOLVED", recipeId: recipe.recipeId, message: `${canonicalProductId} не имеет RESOLVED-решения.` });
    }
  }
  return Object.freeze(issues.sort((left, right) => left.recipeId.localeCompare(right.recipeId, "en") || left.code.localeCompare(right.code, "en")));
};
