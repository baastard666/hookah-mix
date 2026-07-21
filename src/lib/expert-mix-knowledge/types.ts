export type ExpertMixRecordStatus = "DRAFT" | "VERIFIED" | "PARTIALLY_VERIFIED" | "DISPUTED" | "REJECTED" | "ARCHIVED";
export type ExpertMixRecordKind = "SINGLE_PRODUCT_SESSION" | "MIX";
export type ExpertKnowledgeConfidence = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
export type ExpertMixIdentityStatus = "RESOLVED" | "MANUFACTURER_ONLY" | "UNRESOLVED" | "AMBIGUOUS" | "NOT_CHECKED";
export type ExpertMixComponentRole = "BASE" | "ACCENT" | "SUPPORT" | "COOLING" | "SWEETENER" | "SPICE" | "TEXTURE" | "UNKNOWN";
export type KnowledgeOrigin = "SOURCE_STATED" | "EDITOR_INTERPRETED" | "DERIVED" | "INTERNAL_TEST";

export type ComponentProportion =
  | { readonly type: "PERCENT"; readonly value: number }
  | { readonly type: "APPROXIMATE_PERCENT"; readonly value: number; readonly tolerance?: number }
  | { readonly type: "PARTS"; readonly value: number }
  | { readonly type: "UNKNOWN" };

export type MixProportions =
  | { readonly type: "PERCENT"; readonly tolerance?: number }
  | { readonly type: "PARTS"; readonly totalParts?: number }
  | { readonly type: "ORDER_ONLY" }
  | { readonly type: "UNKNOWN" };

export type ExpertMixComponent = {
  readonly componentId: string;
  readonly position: number;
  readonly rawProductName: string;
  readonly canonicalProductId?: string;
  readonly manufacturerId?: string;
  readonly productLineId?: string;
  readonly canonicalProductName?: string;
  readonly identityStatus: ExpertMixIdentityStatus;
  readonly identityConfidence?: ExpertKnowledgeConfidence;
  readonly proportion?: ComponentProportion;
  readonly role?: ExpertMixComponentRole;
  readonly roleOrigin?: KnowledgeOrigin;
  readonly notes?: string;
};

export type ExpertKnowledgeSourceType = "VIDEO" | "ARTICLE" | "SOCIAL_POST" | "RETAILER" | "MANUFACTURER" | "EXPERT_REVIEW" | "INTERNAL_TEST" | "USER_FEEDBACK" | "OTHER";
export type AuthorVisibility = "INTERNAL_ONLY" | "PUBLIC_ANONYMOUS" | "PUBLIC_ALLOWED";
export type ExpertKnowledgeSource = {
  readonly sourceId: string;
  readonly sourceType: ExpertKnowledgeSourceType;
  readonly internalLabel?: string;
  readonly publicLabel?: string;
  readonly url?: string;
  readonly publishedAt?: string;
  readonly accessedAt?: string;
  readonly language?: string;
  readonly authorVisibility: AuthorVisibility;
};

export type ExpertEvidenceType = "DIRECT_STATEMENT" | "OBSERVED_REACTION" | "INGREDIENT_LIST" | "PROPORTION_STATEMENT" | "PREPARATION_STATEMENT" | "RATING" | "EDITOR_NOTE" | "CROSS_SOURCE_CONFIRMATION" | "INTERNAL_TEST_RESULT";
export type ExpertKnowledgeEvidence = {
  readonly evidenceId: string;
  readonly type: ExpertEvidenceType;
  readonly sourceId: string;
  readonly reference?: string;
  readonly timestampStartSeconds?: number;
  readonly timestampEndSeconds?: number;
  readonly excerpt?: string;
  readonly summary?: string;
  readonly confidence: ExpertKnowledgeConfidence;
  readonly checkedAt?: string;
};

export type ObservationSubject =
  | { readonly type: "MIX" }
  | { readonly type: "COMPONENT"; readonly componentId: string }
  | { readonly type: "COMPONENT_PAIR"; readonly componentIds: readonly [string, string] }
  | { readonly type: "PREPARATION" }
  | { readonly type: "SESSION" };

type ObservationBase<T extends string> = {
  readonly observationId: string;
  readonly type: T;
  readonly subject: ObservationSubject;
  readonly origin: KnowledgeOrigin;
  readonly confidence: ExpertKnowledgeConfidence;
  readonly evidenceIds: readonly string[];
  readonly notes?: string;
};

export type FlavorDescriptorObservation = ObservationBase<"FLAVOR_DESCRIPTOR"> & {
  readonly rawDescriptor: string;
  readonly normalizedDescriptor?: string;
  readonly intensity: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" | "UNKNOWN";
  readonly sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "MIXED" | "UNKNOWN";
};
export type BalanceObservation = ObservationBase<"BALANCE"> & { readonly balance: "BALANCED" | "MOSTLY_BALANCED" | "UNBALANCED" | "UNKNOWN" };
export type DominanceObservation = ObservationBase<"DOMINANCE"> & { readonly dominantComponentId: string; readonly dominatedComponentIds: readonly string[]; readonly level: "SLIGHT" | "MODERATE" | "STRONG" | "COMPLETE" | "UNKNOWN" };
export type StrengthObservation = ObservationBase<"STRENGTH"> & { readonly strength: "VERY_LIGHT" | "LIGHT" | "MEDIUM" | "STRONG" | "VERY_STRONG" | "UNKNOWN" };
export type HeatBehaviorObservation = ObservationBase<"HEAT_BEHAVIOR"> & { readonly behavior: "HEAT_TOLERANT" | "MODERATELY_HEAT_TOLERANT" | "HEAT_SENSITIVE" | "OVERHEATS_QUICKLY" | "NEEDS_MORE_HEAT" | "UNKNOWN"; readonly recommendedHeatLevel?: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN"; readonly overheatingRisk?: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN" };
export type SessionBehaviorObservation = ObservationBase<"SESSION_BEHAVIOR"> & { readonly stage: "OPENING" | "MIDDLE" | "ENDING" | "WHOLE_SESSION" | "UNKNOWN"; readonly behavior: string; readonly intensity: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" | "UNKNOWN" };
export type CompatibilityObservation = ObservationBase<"COMPATIBILITY"> & { readonly result: "EXCELLENT" | "GOOD" | "ACCEPTABLE" | "POOR" | "CONFLICTING" | "UNKNOWN"; readonly reasonDescriptors: readonly string[] };
export type FreeformObservation = ObservationBase<"FREEFORM"> & { readonly text: string };
export type ExpertMixObservation = FlavorDescriptorObservation | BalanceObservation | DominanceObservation | StrengthObservation | HeatBehaviorObservation | SessionBehaviorObservation | CompatibilityObservation | FreeformObservation;

export type ExpertMixPreparation = {
  readonly bowl?: { readonly type?: string; readonly material?: string; readonly capacityGrams?: number; readonly packingStyle?: "FLUFF" | "SEMI_DENSE" | "DENSE" | "OVERPACK" | "CONTACT" | "UNKNOWN" };
  readonly heatManagement?: { readonly type: "HMD" | "FOIL" | "UNKNOWN"; readonly device?: string };
  readonly coals?: { readonly initialCount?: number; readonly workingCount?: number; readonly sizeMm?: number; readonly placement?: string };
  readonly warmupMinutes?: number;
  readonly tobaccoPreparation?: { readonly actions: readonly ("MIXED_TOGETHER" | "LAYERED" | "SECTOR_PACKED" | "FLUFFED" | "PRESSED" | "CUT_ADJUSTED" | "MOISTURE_REMOVED" | "UNKNOWN")[] };
  readonly notes?: string;
};

export type ExpertMixVerdict = "EXCELLENT" | "GOOD" | "ACCEPTABLE" | "POOR" | "FAILED" | "MIXED" | "UNKNOWN";
export type ExpertMixRating =
  | { readonly scale: 5; readonly value: number }
  | { readonly scale: 10; readonly value: number }
  | { readonly scale: 100; readonly value: number }
  | { readonly scale: "QUALITATIVE"; readonly value: ExpertMixVerdict };
export type ExpertMixEvaluation = {
  readonly verdict: ExpertMixVerdict;
  readonly rating?: ExpertMixRating;
  readonly recommended?: boolean;
  readonly repeatIntention?: "YES" | "MAYBE" | "NO" | "UNKNOWN";
  readonly targetAudience?: readonly string[];
  readonly summary?: string;
  readonly evidenceIds?: readonly string[];
};

export type ExpertMixKnowledgeRecord = {
  readonly id: string;
  readonly title?: string;
  readonly recordKind: ExpertMixRecordKind;
  readonly status: ExpertMixRecordStatus;
  readonly components: readonly ExpertMixComponent[];
  readonly proportions: MixProportions;
  readonly preparation?: ExpertMixPreparation;
  readonly observations: readonly ExpertMixObservation[];
  readonly evaluation?: ExpertMixEvaluation;
  readonly source: ExpertKnowledgeSource;
  readonly evidence: readonly ExpertKnowledgeEvidence[];
  readonly confidence: ExpertKnowledgeConfidence;
  readonly createdAt?: string;
  readonly checkedAt?: string;
  readonly tags: readonly string[];
  readonly notes?: string;
  readonly schemaVersion: "expert-mix-knowledge-v1";
};

export type ExpertMixValidationSeverity = "ERROR" | "WARNING" | "INFO";
export type ExpertMixValidationCode =
  | "INVALID_RECORD" | "EMPTY_COMPONENTS" | "TOO_FEW_COMPONENTS" | "TOO_MANY_COMPONENTS" | "DUPLICATE_COMPONENT_ID" | "DUPLICATE_COMPONENT_POSITION"
  | "INVALID_PERCENT" | "PERCENT_TOTAL_MISMATCH" | "INVALID_PART_VALUE" | "EMPTY_PRODUCT_NAME" | "EMPTY_SOURCE"
  | "INVALID_TIMESTAMP_RANGE" | "UNKNOWN_EVIDENCE_REFERENCE" | "UNKNOWN_COMPONENT_REFERENCE" | "DUPLICATE_EVIDENCE_ID"
  | "DUPLICATE_OBSERVATION_ID" | "INVALID_RATING" | "INVALID_PREPARATION_VALUE" | "INVALID_PROPORTION_MODEL"
  | "SINGLE_COMPONENT_RECORD" | "UNRESOLVED_COMPONENT" | "VERIFIED_WITH_UNRESOLVED_COMPONENT" | "OBSERVATION_WITHOUT_EVIDENCE"
  | "EVALUATION_WITHOUT_EVIDENCE" | "UNKNOWN_PROPORTIONS" | "LOW_CONFIDENCE_RECORD" | "MISSING_CHECKED_AT" | "PUBLIC_SOURCE_LABEL_EXPOSES_INTERNAL_NAME";
export type ExpertMixValidationIssue = { readonly code: ExpertMixValidationCode; readonly path: string; readonly severity: ExpertMixValidationSeverity; readonly message: string; readonly context?: Readonly<Record<string, unknown>> };
export type ExpertMixValidationResult =
  | { readonly valid: true; readonly record: ExpertMixKnowledgeRecord; readonly warnings: readonly ExpertMixValidationIssue[] }
  | { readonly valid: false; readonly errors: readonly ExpertMixValidationIssue[]; readonly warnings: readonly ExpertMixValidationIssue[]; readonly partialRecord?: Partial<ExpertMixKnowledgeRecord> };

export type ExternalMixComponentInput = Omit<ExpertMixComponent, "componentId" | "position"> & { readonly componentId?: string; readonly position?: number };
export type ExternalKnowledgeSourceInput = Omit<ExpertKnowledgeSource, "sourceId"> & { readonly sourceId?: string };
type OptionalObservationId<T> = T extends ExpertMixObservation ? Omit<T, "observationId"> & { readonly observationId?: string } : never;
export type ExternalObservationInput = OptionalObservationId<ExpertMixObservation>;
export type ExternalExpertKnowledgeEvidenceInput = Omit<ExpertKnowledgeEvidence, "evidenceId" | "sourceId"> & { readonly evidenceId?: string; readonly sourceId?: string };
export type ExternalProportionInput = MixProportions;
export type ExternalPreparationInput = ExpertMixPreparation;
export type ExternalEvaluationInput = ExpertMixEvaluation;
export type ExternalExpertMixInput = {
  readonly externalId?: string;
  readonly title?: string;
  readonly status?: ExpertMixRecordStatus;
  readonly components: readonly ExternalMixComponentInput[];
  readonly source: ExternalKnowledgeSourceInput;
  readonly proportions?: ExternalProportionInput;
  readonly preparation?: ExternalPreparationInput;
  readonly observations?: readonly ExternalObservationInput[];
  readonly evaluation?: ExternalEvaluationInput;
  readonly confidence?: ExpertKnowledgeConfidence;
  readonly evidence?: readonly ExternalExpertKnowledgeEvidenceInput[];
  readonly tags?: readonly string[];
  readonly notes?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
};
export type AdaptExternalExpertMixResult = ExpertMixValidationResult;

export type PublicExpertKnowledgeSource = { readonly sourceType: ExpertKnowledgeSourceType; readonly label: string; readonly url?: string; readonly publishedAt?: string; readonly language?: string; readonly authorVisibility: AuthorVisibility };
type PublicExpertMixObservation = ExpertMixObservation extends infer T ? T extends ExpertMixObservation ? Omit<T, "notes" | "evidenceIds"> : never : never;
type PublicExpertMixEvaluation = Omit<ExpertMixEvaluation, "evidenceIds">;
export type PublicExpertMixKnowledgeRecord = Omit<ExpertMixKnowledgeRecord, "source" | "evidence" | "notes" | "observations" | "evaluation"> & {
  readonly source: PublicExpertKnowledgeSource;
  readonly observations: readonly PublicExpertMixObservation[];
  readonly evaluation?: PublicExpertMixEvaluation;
};

export type ExpertMixKnowledgeRegistry = {
  readonly get: (id: string) => Readonly<ExpertMixKnowledgeRecord> | null;
  readonly has: (id: string) => boolean;
  readonly list: () => readonly Readonly<ExpertMixKnowledgeRecord>[];
  readonly findByProductId: (productId: string) => readonly Readonly<ExpertMixKnowledgeRecord>[];
  readonly findByManufacturerId: (manufacturerId: string) => readonly Readonly<ExpertMixKnowledgeRecord>[];
  readonly findByStatus: (status: ExpertMixRecordStatus) => readonly Readonly<ExpertMixKnowledgeRecord>[];
  readonly findByTag: (tag: string) => readonly Readonly<ExpertMixKnowledgeRecord>[];
  readonly listSources: () => readonly Readonly<ExpertKnowledgeSource>[];
};
