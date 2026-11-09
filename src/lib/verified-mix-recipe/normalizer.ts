import { normalizeExpertKnowledgeTag } from "../expert-mix-knowledge";
import { deepCloneAndFreeze } from "../expert-mix-knowledge/normalizer";
import type { ExpertMixKnowledgeRecord, ExpertMixPreparation, ExpertMixRating } from "../expert-mix-knowledge";
import { VERIFIED_MIX_RECIPE_SCHEMA_VERSION } from "./constants";
import { createVerifiedMixRecipeId } from "./ids";
import type { VerifiedMixRecipe, VerifiedMixRecipeEvaluation, VerifiedMixRecipePreparation, VerifiedMixRecipeVerification } from "./types";

const numericRating = (rating: ExpertMixRating | undefined): { readonly value: number; readonly scale: 5 | 10 | 100 } | null => {
  if (!rating || rating.scale === "QUALITATIVE") return null;
  const value = rating.scale === 5 ? rating.value * 2 : rating.scale === 100 ? rating.value / 10 : rating.value;
  return { value, scale: rating.scale };
};

const safePreparation = (preparation: ExpertMixPreparation | undefined): VerifiedMixRecipePreparation | null => {
  if (!preparation) return null;
  const { notes: _notes, ...safe } = preparation;
  void _notes;
  return safe;
};

const uniqueTags = (tags: readonly string[]): readonly string[] => {
  const seen = new Set<string>();
  return tags.reduce<string[]>((result, tag) => {
    const normalized = normalizeExpertKnowledgeTag(tag);
    if (normalized && !seen.has(normalized)) { seen.add(normalized); result.push(tag.trim()); }
    return result;
  }, []);
};

const verificationFor = (record: ExpertMixKnowledgeRecord): VerifiedMixRecipeVerification => {
  const proportionEvidence = record.evidence.filter(item => item.type === "PROPORTION_STATEMENT" || item.type === "INTERNAL_TEST_RESULT");
  const sourceIds = new Set(record.evidence.map(item => item.sourceId));
  // Current ExpertMixKnowledge records have one top-level source only. Its evidence can substantiate
  // the record, but cannot substantiate an *independent* confirmation by itself.
  const independentEvidenceCount = sourceIds.size > 1 ? sourceIds.size : 0;
  const hasInternalTestEvidence = record.source.sourceType === "INTERNAL_TEST" || record.evidence.some(item => item.type === "INTERNAL_TEST_RESULT");
  return {
    proportionsConfirmed: record.proportions.type === "PERCENT" && proportionEvidence.length > 0,
    proportionEvidenceCount: proportionEvidence.length,
    independentEvidenceCount,
    hasInternalTestEvidence,
    hasObservedReactionEvidence: record.evidence.some(item => item.type === "OBSERVED_REACTION"),
  };
};

const evaluationFor = (record: ExpertMixKnowledgeRecord): VerifiedMixRecipeEvaluation | null => {
  if (!record.evaluation) return null;
  const rating = numericRating(record.evaluation.rating);
  return {
    verdict: record.evaluation.verdict,
    numericRating: rating?.value ?? null,
    numericRatingSourceScale: rating?.scale ?? null,
    qualitativeRating: record.evaluation.rating?.scale === "QUALITATIVE" ? record.evaluation.rating.value : null,
    recommended: record.evaluation.recommended ?? null,
    repeatIntention: record.evaluation.repeatIntention ?? null,
  };
};

export const normalizeVerifiedMixRecipe = (record: ExpertMixKnowledgeRecord): VerifiedMixRecipe => {
  const components = record.components.map(component => {
    if (component.proportion?.type !== "PERCENT" || !component.canonicalProductId) throw new Error(`Нельзя нормализовать неполный verified recipe ${record.id}.`);
    return { canonicalProductId: component.canonicalProductId, percentage: component.proportion.value, role: component.role ?? null, position: component.position };
  }).sort((left, right) => left.position - right.position || left.canonicalProductId.localeCompare(right.canonicalProductId, "en"));
  const totalPercentage = components.reduce((sum, component) => sum + component.percentage, 0);
  const verification = verificationFor(record);
  const recipeId = createVerifiedMixRecipeId({ sourceRecordId: record.id, components: components.map(item => [item.canonicalProductId, item.percentage, item.position]) });
  const title = record.title?.trim() || components.map(component => component.canonicalProductId).join(" + ");
  return deepCloneAndFreeze({
    recipeId, sourceRecordId: record.id, title, components, totalPercentage, tags: uniqueTags(record.tags), confidence: record.confidence,
    verification, preparation: safePreparation(record.preparation), evaluation: evaluationFor(record), schemaVersion: VERIFIED_MIX_RECIPE_SCHEMA_VERSION,
  });
};
