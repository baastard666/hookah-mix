import type { FlavorProfileField } from "../flavors/types";
import type { MixAnalysisResult } from "../mix-analysis";
import type { FlavorNoteCategory } from "../flavor-knowledge";
import type { PublicVerifiedMixRecipe, VerifiedMixRecipe } from "../verified-mix-recipe";

export type VerifiedRecipeComponentInput = {
  readonly recipe: VerifiedMixRecipe;
};

export type VerifiedRecipeFlavorSummary = {
  readonly sweetness: number | null;
  readonly sourness: number | null;
  readonly acidity: number | null;
  readonly freshness: number | null;
  readonly intensity: number | null;
  readonly strength: number | null;
  readonly heatResistance: number | null;
  readonly juiciness: number | null;
  readonly dominantCategories: readonly FlavorNoteCategory[];
  readonly secondaryCategories: readonly FlavorNoteCategory[];
  readonly dominantComponentId: string;
  readonly dominantInfluenceShare: number;
  readonly dominanceLevel: MixAnalysisResult["mixProfile"]["dominanceLevel"];
};

export type VerifiedRecipeComponentContribution = {
  readonly canonicalProduct: {
    readonly canonicalProductId: string;
    readonly manufacturer: string;
    readonly productLine: string | null;
    readonly productName: string;
  };
  readonly percentage: number;
  readonly influenceScore: number;
  readonly influenceShare: number;
  readonly sourceStatedRole: string | null;
  readonly recordedRole: string | null;
  readonly roleOrigin: string | null;
  readonly inferredRole: null;
  readonly dominantCategories: readonly FlavorNoteCategory[];
  readonly contributedParameters: readonly {
    readonly field: FlavorProfileField;
    readonly value: number;
    readonly source: "CANONICAL_PRODUCT_PROFILE" | "CANONICAL_TECHNICAL_PROFILE";
  }[];
};

export type VerifiedRecipeDataCoverage = {
  readonly canonicalIdentityCoverage: number;
  readonly productProfileCoverage: number;
  readonly productProfileComponentCount: number;
  readonly componentCount: number;
  readonly filledProfileDimensions: readonly FlavorProfileField[];
  readonly nullProfileDimensions: readonly FlavorProfileField[];
  readonly fallbackComponentCount: number;
};

export type VerifiedRecipeExplainability = {
  readonly positiveFactors: readonly { readonly category: string; readonly title: string; readonly description: string; readonly impact: number }[];
  readonly risks: readonly { readonly severity: "LOW" | "MEDIUM" | "HIGH"; readonly title: string; readonly description: string; readonly impact: number }[];
};

export type VerifiedRecipeObservedLayer = {
  readonly smokeScore: number | null;
  readonly evaluation: PublicVerifiedMixRecipe["evaluation"];
  readonly hasObservedEvaluation: boolean;
};

export type PublicVerifiedRecipeAnalysis = {
  readonly mixProfile: MixAnalysisResult["mixProfile"];
  readonly compatibility: MixAnalysisResult["compatibility"];
  readonly recommendations: MixAnalysisResult["recommendations"];
  readonly predictedQualityScore: number;
  readonly predictionConfidenceScore: number;
  readonly predictionConfidenceLabel: MixAnalysisResult["summary"]["confidenceLabel"];
  readonly dataQuality: number;
  readonly riskScore: number;
  readonly proposalComparison: {
    readonly accepted: boolean;
    readonly targetRiskReduced: boolean;
    readonly rejectionReasons: readonly string[];
  } | null;
  readonly engineVersions: {
    readonly canonicalMixScoring: MixAnalysisResult["scoring"]["version"];
    readonly mixProfile: MixAnalysisResult["mixProfile"]["metadata"]["calculationVersion"];
    readonly compatibility: MixAnalysisResult["compatibility"]["metadata"]["calculationVersion"];
    readonly recommendation: MixAnalysisResult["recommendations"]["version"];
  };
};

export type VerifiedRecipeAnalysis = {
  readonly recipeId: string;
  readonly recipe: PublicVerifiedMixRecipe;
  readonly analysis: PublicVerifiedRecipeAnalysis;
  readonly flavorSummary: VerifiedRecipeFlavorSummary;
  readonly components: readonly VerifiedRecipeComponentContribution[];
  readonly coverage: VerifiedRecipeDataCoverage;
  readonly explainability: VerifiedRecipeExplainability;
  readonly predicted: {
    readonly qualityScore: number;
    readonly confidenceScore: number;
    readonly compatibilityScore: number;
    readonly riskScore: number;
    readonly recommendationsArePredictedAlternatives: true;
  };
  readonly observed: VerifiedRecipeObservedLayer;
  readonly metadata: { readonly calculationVersion: "verified-mix-analysis-v1" };
};

export type VerifiedMixAnalysisAuditRecord = {
  readonly recipeId: string;
  readonly componentCount: number;
  readonly percentages: readonly number[];
  readonly canonicalCoverage: number;
  readonly productProfileCoverage: number;
  readonly fallbackComponentCount: number;
  readonly filledProfileDimensions: readonly FlavorProfileField[];
  readonly nullDimensions: readonly FlavorProfileField[];
  readonly predictedQualityScore: number;
  readonly predictionConfidenceScore: number;
  readonly confidenceLabel: string;
  readonly dataQuality: number;
  readonly compatibilityScore: number;
  readonly riskScore: number;
  readonly dominantComponentId: string;
  readonly dominantInfluenceShare: number;
  readonly dominantCategories: readonly FlavorNoteCategory[];
  readonly recommendationCount: number;
  readonly acceptedProposal: boolean;
  readonly warnings: readonly string[];
};

export type VerifiedMixAnalysisDistribution = {
  readonly min: number | null;
  readonly max: number | null;
  readonly mean: number | null;
  readonly median: number | null;
  readonly p25: number | null;
  readonly p75: number | null;
};

export type VerifiedMixAnalysisAudit = {
  readonly version: "verified-mix-analysis-audit-v1";
  readonly recipesAnalyzed: number;
  readonly failures: readonly { readonly recipeId: string; readonly code: string }[];
  readonly totalComponents: number;
  readonly productProfileCoverage: number;
  readonly fallbackComponents: number;
  readonly nullDimensionCounts: Readonly<Record<FlavorProfileField, number>>;
  readonly predictedQualityScore: VerifiedMixAnalysisDistribution;
  readonly predictionConfidenceScore: VerifiedMixAnalysisDistribution;
  readonly dataQuality: VerifiedMixAnalysisDistribution;
  readonly compatibilityScore: VerifiedMixAnalysisDistribution;
  readonly riskScore: VerifiedMixAnalysisDistribution;
  readonly confidenceLabels: Readonly<Record<"Предварительная" | "Средняя" | "Высокая" | "Подтверждённая", number>>;
  readonly duplicatePredictedScores: readonly { readonly score: number; readonly count: number }[];
  readonly withinPointTwoOfMedian: number;
  readonly recipesWithFallback: number;
  readonly recommendations: { readonly withRecommendations: number; readonly acceptedVariants: number; readonly unchanged: number; readonly rejectedProposals: number };
  readonly records: readonly VerifiedMixAnalysisAuditRecord[];
  readonly privacyIssues: readonly string[];
};
