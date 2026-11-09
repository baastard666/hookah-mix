import type { ExpertMixKnowledgeRecord } from "../expert-mix-knowledge";
import { VERIFIED_MIX_RECIPE_SKIP_CODES } from "./constants";
import { evaluateVerifiedMixRecipeEligibility } from "./eligibility";
import { auditPublicVerifiedMixRecipes, mapVerifiedMixRecipeToPublic } from "./public-mapper";
import type { TobaccoIdentityDecisionRegistry } from "../tobacco-identity-decisions";
import type { VerifiedMixRecipe, VerifiedMixRecipeAuditReport, VerifiedMixRecipeValidationIssue } from "./types";

export const createVerifiedMixRecipeAudit = (
  records: readonly ExpertMixKnowledgeRecord[],
  recipes: readonly VerifiedMixRecipe[],
  decisions: TobaccoIdentityDecisionRegistry,
  validationIssues: readonly VerifiedMixRecipeValidationIssue[],
): VerifiedMixRecipeAuditReport => {
  const statuses = { VERIFIED: 0, PARTIALLY_VERIFIED: 0, DISPUTED: 0, DRAFT: 0, REJECTED: 0, ARCHIVED: 0 };
  const skipReasons = Object.fromEntries(VERIFIED_MIX_RECIPE_SKIP_CODES.map(code => [code, 0])) as Record<(typeof VERIFIED_MIX_RECIPE_SKIP_CODES)[number], number>;
  let mixes = 0;
  let singleProductSessions = 0;
  let verifiedMixCandidates = 0;
  let skippedRecipes = 0;
  for (const record of records) {
    statuses[record.status] += 1;
    if (record.recordKind === "MIX") mixes += 1;
    else singleProductSessions += 1;
    if (record.recordKind === "MIX" && record.status === "VERIFIED") {
      verifiedMixCandidates += 1;
      const eligibility = evaluateVerifiedMixRecipeEligibility(record, decisions);
      if (!eligibility.eligible) {
        skippedRecipes += 1;
        for (const item of eligibility.issues) skipReasons[item.code] += 1;
      }
    }
  }
  const totalRecipeComponents = recipes.reduce((sum, recipe) => sum + recipe.components.length, 0);
  const uniqueCanonicalProducts = new Set(recipes.flatMap(recipe => recipe.components.map(component => component.canonicalProductId))).size;
  const publicRecipes = recipes.map(mapVerifiedMixRecipeToPublic);
  return Object.freeze({
    version: "verified-mix-recipe-audit-v1",
    records: { total: records.length, mixes, singleProductSessions, statuses },
    verifiedMixCandidates,
    eligibleRecipes: recipes.length,
    skippedRecipes,
    skipReasons,
    totalRecipeComponents,
    uniqueCanonicalProducts,
    recipesWithPreparation: recipes.filter(recipe => recipe.preparation !== null).length,
    recipesWithEvaluation: recipes.filter(recipe => recipe.evaluation !== null).length,
    recipesWithNumericRating: recipes.filter(recipe => recipe.evaluation?.numericRating !== null && recipe.evaluation?.numericRating !== undefined).length,
    recipesWithQualitativeOnlyVerdict: recipes.filter(recipe => recipe.evaluation?.qualitativeRating !== null && recipe.evaluation?.numericRating === null).length,
    proportionsConfirmed: recipes.filter(recipe => recipe.verification.proportionsConfirmed).length,
    recipesWithIndependentEvidence: recipes.filter(recipe => recipe.verification.independentEvidenceCount > 0).length,
    recipesWithInternalTestEvidence: recipes.filter(recipe => recipe.verification.hasInternalTestEvidence).length,
    recipesWithObservedReactionEvidence: recipes.filter(recipe => recipe.verification.hasObservedReactionEvidence).length,
    validationIssues: Object.freeze([...validationIssues]),
    privacyIssues: auditPublicVerifiedMixRecipes(publicRecipes),
  });
};
