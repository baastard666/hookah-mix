export type FlavorNoteCategory =
  | "BERRY" | "FRUIT" | "CITRUS" | "TROPICAL" | "FLORAL" | "HERBAL"
  | "MINT" | "COOLING" | "SPICE" | "DESSERT" | "CREAMY" | "VANILLA"
  | "BEVERAGE" | "TEA" | "COFFEE" | "NUT" | "BAKERY" | "CANDY"
  | "CHOCOLATE" | "ALCOHOL" | "WOODY" | "SMOKY" | "TOBACCO" | "SOUR" | "FRESH";

export type FlavorNoteCategoryDefinition = {
  readonly id: FlavorNoteCategory;
  readonly parentId?: FlavorNoteCategory;
  readonly relatedCategoryIds: readonly FlavorNoteCategory[];
  readonly tags: readonly string[];
};

export type FlavorCategoryRelationType =
  | "STRONG_MATCH" | "GOOD_MATCH" | "COMPLEMENTARY_CONTRAST"
  | "NEUTRAL" | "RISKY" | "CONFLICT";

export type FlavorCategoryRelation = {
  readonly left: FlavorNoteCategory;
  readonly right: FlavorNoteCategory;
  readonly type: FlavorCategoryRelationType;
  readonly baseScore: number;
  readonly ruleId: string;
  readonly evidenceIds: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
};

export type FlavorNoteKnowledge = {
  readonly noteId: string;
  readonly canonicalName: string;
  readonly categoryIds: readonly FlavorNoteCategory[];
  readonly aliases: readonly string[];
  readonly relatedNoteIds: readonly string[];
  readonly tags: readonly string[];
  readonly evidenceIds: readonly string[];
};

export type KnowledgeEvidenceType =
  | "MANUFACTURER_DESCRIPTION" | "EDITORIAL_RESEARCH" | "COMMUNITY_AGGREGATE"
  | "VERIFIED_TEST" | "INTERNAL_EXPERT_RULE" | "INFERRED_RELATION";

export type KnowledgeEvidence = {
  readonly id: string;
  readonly type: KnowledgeEvidenceType;
  readonly sourceName?: string;
  readonly reference?: string;
  readonly observedAt?: string;
  readonly weight: number;
  readonly notes?: string;
};

export type KnowledgeClaimSubjectType = "NOTE" | "CATEGORY" | "CATEGORY_RELATION" | "NOTE_RELATION";
export type KnowledgeClaim<T = unknown> = {
  readonly id: string;
  readonly subjectType: KnowledgeClaimSubjectType;
  readonly subjectIds: readonly string[];
  readonly claimType: string;
  readonly value: T;
  readonly evidenceIds: readonly string[];
};

export type KnowledgeConfidenceReason = {
  readonly code: string;
  readonly impact: number;
  readonly description: string;
};

export type KnowledgeConfidence = {
  readonly score: number;
  readonly level: "LOW" | "MEDIUM" | "HIGH";
  readonly evidenceCount: number;
  readonly sourceDiversity: number;
  readonly reasons: readonly KnowledgeConfidenceReason[];
};

export type KnowledgeExplanationReference = {
  readonly ruleId: string;
  readonly claimIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly confidenceScore: number;
};

export type FlavorKnowledgeRegistry = {
  readonly categories: readonly FlavorNoteCategoryDefinition[];
  readonly categoryRelations: readonly FlavorCategoryRelation[];
  readonly notes: readonly FlavorNoteKnowledge[];
  readonly evidence: readonly KnowledgeEvidence[];
  readonly claims: readonly KnowledgeClaim[];
};

export type KnowledgeValidationResult = { readonly success: boolean; readonly errors: readonly string[] };
