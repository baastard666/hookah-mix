import type { FlavorNoteCategory } from "../flavor-knowledge";
import type { FlavorProfileField } from "../flavors/types";
import type { MixCompatibilityResult } from "../mix-compatibility";
import type { MixProfileComponentInput, MixProfileResult } from "../mix-profile";

export type RecommendationStatus = "NO_CHANGES_NEEDED" | "MINOR_ADJUSTMENTS" | "SIGNIFICANT_ADJUSTMENTS" | "INSUFFICIENT_DATA";
export type RecommendationType = "DECREASE_COMPONENT" | "INCREASE_COMPONENT" | "REBALANCE_COMPONENTS" | "REMOVE_COMPONENT" | "ADD_NOTE_DIRECTION" | "REDUCE_PROFILE_OVERLOAD" | "PRESERVE_CURRENT_MIX" | "INSUFFICIENT_DATA";
export type RecommendationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ComponentRole = "BASE" | "SUPPORT" | "ACCENT" | "TRACE";
export type RecommendationReasonCode =
  | "DOMINANT_COMPONENT_OVERUSED" | "WEAK_COMPONENT_MAY_DISAPPEAR" | "MULTIPLE_COMPETING_BASES"
  | "NO_CLEAR_BASE" | "EXCESSIVE_SWEETNESS" | "EXCESSIVE_COOLING" | "FLORAL_OVERLOAD"
  | "BITTER_SOUR_CONFLICT" | "EXCESSIVE_DRYNESS" | "ADD_COMPLEMENTARY_CONTRAST"
  | "ADD_SOFTENING_DIRECTION" | "MIX_ALREADY_BALANCED" | "PROFILE_DATA_INCOMPLETE"
  | "KNOWLEDGE_CONFIDENCE_LOW" | "RISKY_CATEGORY_PAIR" | "MULTIPLE_PROFILE_EXTREMES";

export type PercentageRange = { readonly min: number; readonly max: number };
export type DecreaseComponentAction = { readonly type: "DECREASE_COMPONENT"; readonly componentId: string; readonly currentPercentage: number; readonly suggestedPercentageRange: PercentageRange; readonly suggestedRole: ComponentRole };
export type IncreaseComponentAction = { readonly type: "INCREASE_COMPONENT"; readonly componentId: string; readonly currentPercentage: number; readonly suggestedPercentageRange: PercentageRange; readonly suggestedRole: ComponentRole };
export type RemoveComponentAction = { readonly type: "REMOVE_COMPONENT"; readonly componentId: string; readonly currentPercentage: number };
export type RebalanceComponentsAction = { readonly type: "REBALANCE_COMPONENTS"; readonly primaryComponentId?: string; readonly adjustments: readonly { readonly componentId: string; readonly currentPercentage: number; readonly suggestedPercentageRange: PercentageRange; readonly suggestedRole: ComponentRole }[] };
export type AddNoteDirectionAction = { readonly type: "ADD_NOTE_DIRECTION"; readonly categoryIds: readonly FlavorNoteCategory[]; readonly recommendedRole: ComponentRole; readonly suggestedPercentageRange?: PercentageRange };
export type ReduceProfileOverloadAction = { readonly type: "REDUCE_PROFILE_OVERLOAD"; readonly characteristicKeys: readonly FlavorProfileField[] };
export type PreserveCurrentMixAction = { readonly type: "PRESERVE_CURRENT_MIX" };
export type InsufficientDataAction = { readonly type: "INSUFFICIENT_DATA"; readonly missingFields: readonly string[] };
export type RecommendationAction = DecreaseComponentAction | IncreaseComponentAction | RemoveComponentAction | RebalanceComponentsAction | AddNoteDirectionAction | ReduceProfileOverloadAction | PreserveCurrentMixAction | InsufficientDataAction;

export type RecommendationReason = {
  readonly code: RecommendationReasonCode;
  readonly sourceRuleIds: readonly string[];
  readonly componentIds: readonly string[];
  readonly characteristicKeys: readonly FlavorProfileField[];
  readonly noteIds: readonly string[];
  readonly categoryIds: readonly FlavorNoteCategory[];
  readonly metadata: Readonly<Record<string, unknown>>;
};

export type MixRecommendation = {
  readonly id: string;
  readonly type: RecommendationType;
  readonly priority: RecommendationPriority;
  readonly confidenceScore: number;
  readonly impactScore: number;
  readonly componentIds: readonly string[];
  readonly characteristicKeys: readonly FlavorProfileField[];
  readonly noteIds: readonly string[];
  readonly categoryIds: readonly FlavorNoteCategory[];
  readonly action: RecommendationAction;
  readonly reasons: readonly RecommendationReason[];
  readonly sourceRuleIds: readonly string[];
  readonly knowledgeClaimIds: readonly string[];
};

export type SuggestedMixVariant = {
  readonly components: readonly { readonly componentId: string; readonly currentPercentage: number; readonly suggestedPercentage: number }[];
  readonly totalPercentage: 100;
  readonly basedOnRecommendationIds: readonly string[];
};

export type RecommendationSummary = {
  readonly recommendationCount: number;
  readonly primaryRecommendationId?: string;
  readonly priorities: Readonly<Record<RecommendationPriority, number>>;
  readonly reasonCodes: readonly RecommendationReasonCode[];
  readonly suggestedMixVariant?: SuggestedMixVariant;
};

export type RecommendationComponentInput = MixProfileComponentInput & { readonly dataConfidenceScore?: number };
export type MixRecommendationInput = {
  readonly components: readonly RecommendationComponentInput[];
  readonly mixProfile: MixProfileResult;
  readonly compatibility: MixCompatibilityResult;
};

export type MixRecommendationResult = {
  readonly version: "mix-recommendation-v1";
  readonly status: RecommendationStatus;
  readonly recommendations: readonly MixRecommendation[];
  readonly summary: RecommendationSummary;
};
