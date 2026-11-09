import type {
  ExpertKnowledgeConfidence,
  ExpertMixComponentRole,
  ExpertMixEvaluation,
  ExpertMixKnowledgeRecord,
  ExpertMixPreparation,
  ExpertMixVerdict,
} from "../expert-mix-knowledge";

export type VerifiedMixRecipeSkipCode =
  | "NOT_MIX"
  | "NOT_VERIFIED"
  | "TOO_FEW_COMPONENTS"
  | "UNRESOLVED_COMPONENT"
  | "AMBIGUOUS_COMPONENT"
  | "MANUFACTURER_ONLY_COMPONENT"
  | "MISSING_CANONICAL_PRODUCT_ID"
  | "CANONICAL_PRODUCT_NOT_FOUND"
  | "CANONICAL_PRODUCT_NOT_RESOLVED"
  | "UNKNOWN_PROPORTIONS"
  | "APPROXIMATE_PROPORTIONS"
  | "PARTS_ONLY"
  | "ORDER_ONLY_PROPORTIONS"
  | "MISSING_COMPONENT_PERCENTAGE"
  | "PERCENT_TOTAL_MISMATCH"
  | "INVALID_COMPONENT_PERCENTAGE"
  | "DUPLICATE_CANONICAL_COMPONENT"
  | "INVALID_SOURCE_RECORD";

export type VerifiedMixRecipeIssue = {
  readonly code: VerifiedMixRecipeSkipCode;
  readonly recordId: string;
  readonly componentId?: string;
  readonly message: string;
};

export type VerifiedMixRecipeComponent = {
  readonly canonicalProductId: string;
  readonly percentage: number;
  readonly role: ExpertMixComponentRole | null;
  readonly position: number;
};

export type VerifiedMixRecipePreparation = Omit<ExpertMixPreparation, "notes">;

export type VerifiedMixRecipeEvaluation = {
  readonly verdict: ExpertMixVerdict;
  readonly numericRating: number | null;
  readonly numericRatingSourceScale: 5 | 10 | 100 | null;
  readonly qualitativeRating: ExpertMixVerdict | null;
  readonly recommended: boolean | null;
  readonly repeatIntention: NonNullable<ExpertMixEvaluation["repeatIntention"]> | null;
};

export type VerifiedMixRecipeVerification = {
  readonly proportionsConfirmed: boolean;
  readonly proportionEvidenceCount: number;
  readonly independentEvidenceCount: number;
  readonly hasInternalTestEvidence: boolean;
  readonly hasObservedReactionEvidence: boolean;
};

export type VerifiedMixRecipe = {
  readonly recipeId: string;
  readonly sourceRecordId: string;
  readonly title: string;
  readonly components: readonly VerifiedMixRecipeComponent[];
  readonly totalPercentage: number;
  readonly tags: readonly string[];
  readonly confidence: ExpertKnowledgeConfidence;
  readonly verification: VerifiedMixRecipeVerification;
  readonly preparation: VerifiedMixRecipePreparation | null;
  readonly evaluation: VerifiedMixRecipeEvaluation | null;
  readonly schemaVersion: "verified-mix-recipe-v1";
};

export type VerifiedMixRecipeEligibility =
  | { readonly eligible: true; readonly record: ExpertMixKnowledgeRecord }
  | { readonly eligible: false; readonly recordId: string; readonly issues: readonly VerifiedMixRecipeIssue[] };

export type VerifiedMixRecipeValidationIssue = {
  readonly code: "DUPLICATE_RECIPE_ID" | "INVALID_RECIPE" | "CANONICAL_PRODUCT_NOT_FOUND" | "CANONICAL_PRODUCT_NOT_RESOLVED" | "DUPLICATE_CANONICAL_COMPONENT";
  readonly recipeId: string;
  readonly message: string;
};

export type VerifiedMixRecipeAuditReport = {
  readonly version: "verified-mix-recipe-audit-v1";
  readonly records: {
    readonly total: number;
    readonly mixes: number;
    readonly singleProductSessions: number;
    readonly statuses: Readonly<Record<"VERIFIED" | "PARTIALLY_VERIFIED" | "DISPUTED" | "DRAFT" | "REJECTED" | "ARCHIVED", number>>;
  };
  readonly verifiedMixCandidates: number;
  readonly eligibleRecipes: number;
  readonly skippedRecipes: number;
  readonly skipReasons: Readonly<Record<VerifiedMixRecipeSkipCode, number>>;
  readonly totalRecipeComponents: number;
  readonly uniqueCanonicalProducts: number;
  readonly recipesWithPreparation: number;
  readonly recipesWithEvaluation: number;
  readonly recipesWithNumericRating: number;
  readonly recipesWithQualitativeOnlyVerdict: number;
  readonly proportionsConfirmed: number;
  readonly recipesWithIndependentEvidence: number;
  readonly recipesWithInternalTestEvidence: number;
  readonly recipesWithObservedReactionEvidence: number;
  readonly validationIssues: readonly VerifiedMixRecipeValidationIssue[];
  readonly privacyIssues: readonly string[];
};

export type VerifiedMixRecipeRegistry = {
  readonly version: "verified-mix-recipe-registry-v1";
  readonly size: number;
  readonly audit: Readonly<VerifiedMixRecipeAuditReport>;
  readonly get: (recipeId: string) => Readonly<VerifiedMixRecipe> | null;
  readonly has: (recipeId: string) => boolean;
  readonly list: () => readonly Readonly<VerifiedMixRecipe>[];
  readonly findByProductId: (canonicalProductId: string) => readonly Readonly<VerifiedMixRecipe>[];
  readonly findByTag: (tag: string) => readonly Readonly<VerifiedMixRecipe>[];
  readonly findContainingProducts: (canonicalProductIds: readonly string[]) => readonly Readonly<VerifiedMixRecipe>[];
};

export type PublicVerifiedMixRecipe = Omit<VerifiedMixRecipe, "sourceRecordId">;
