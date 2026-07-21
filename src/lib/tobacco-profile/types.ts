export type StrengthLevel = "LOW" | "MEDIUM_LOW" | "MEDIUM" | "MEDIUM_HIGH" | "HIGH" | "UNKNOWN";
export type HeatResistance = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
export type LeafType = "VIRGINIA" | "BURLEY" | "CIGAR" | "BLEND" | "UNKNOWN";
export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";
export type SourceType =
  | "MANUFACTURER" | "MANUFACTURER_CLAIM" | "OFFICIAL_MATERIAL"
  | "EXPERT_CONSENSUS" | "SECONDARY_SOURCES" | "INTERNAL_TEST" | "UNKNOWN";

export type TobaccoProfileEvidence = {
  readonly sourceType: SourceType;
  readonly title: string;
  readonly reference?: string;
  readonly checkedAt: string;
};

export type EvidencedValue<T> = {
  readonly value: T;
  readonly confidence: ConfidenceLevel;
  readonly evidence: readonly TobaccoProfileEvidence[];
  readonly note?: string;
};

export type TobaccoTechnicalProperties = {
  readonly strengthLevel?: EvidencedValue<StrengthLevel>;
  readonly heatResistance?: EvidencedValue<HeatResistance>;
  readonly leafTypes?: EvidencedValue<readonly LeafType[]>;
};

export type ManufacturerProfile = TobaccoTechnicalProperties & {
  readonly manufacturerId: string;
  readonly manufacturer: string;
  readonly aliases: readonly string[];
  readonly dataConfidence: ConfidenceLevel;
  readonly sourceTypes: readonly SourceType[];
  readonly notes: readonly string[];
};

export type ProductLineProfile = TobaccoTechnicalProperties & {
  readonly productLineId: string;
  readonly manufacturerId: string;
  readonly manufacturer: string;
  readonly productLine: string;
  readonly aliases: readonly string[];
  readonly dataConfidence: ConfidenceLevel;
  readonly sourceTypes: readonly SourceType[];
  readonly notes: readonly string[];
};

export type TobaccoProductProfile = TobaccoTechnicalProperties & {
  readonly productId: string;
  readonly manufacturerId: string;
  readonly productLineId?: string;
  readonly productName: string;
  readonly dataConfidence: ConfidenceLevel;
  readonly sourceTypes: readonly SourceType[];
  readonly notes: readonly string[];
};

export type TobaccoProfileRegistry = {
  readonly manufacturers: readonly ManufacturerProfile[];
  readonly productLines: readonly ProductLineProfile[];
  readonly products: readonly TobaccoProductProfile[];
};

export type ResolvedProperty<T> = EvidencedValue<T> & {
  readonly origin: "MANUFACTURER" | "PRODUCT_LINE";
  readonly inherited: boolean;
  readonly inheritedFrom: string | null;
};

export type ResolvedTobaccoProfile = {
  readonly status: "FOUND";
  readonly manufacturer: string;
  readonly productLine: string | null;
  readonly strengthLevel: ResolvedProperty<StrengthLevel> | null;
  readonly heatResistance: ResolvedProperty<HeatResistance> | null;
  readonly leafTypes: ResolvedProperty<readonly LeafType[]> | null;
  readonly dataConfidence: ConfidenceLevel;
  readonly sourceTypes: readonly SourceType[];
  readonly notes: readonly string[];
};

export type TobaccoProfileNotFound = {
  readonly status: "NOT_FOUND";
  readonly missing: "MANUFACTURER" | "PRODUCT_LINE";
  readonly manufacturer: string;
  readonly productLine: string | null;
};

export type TobaccoProfileResolution = ResolvedTobaccoProfile | TobaccoProfileNotFound;
export type ResolveTobaccoProfileInput = { readonly manufacturer: string; readonly productLine?: string | null };
