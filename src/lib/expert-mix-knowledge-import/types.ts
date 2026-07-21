import type { ExpertKnowledgeConfidence, ExpertMixIdentityStatus, ExpertMixKnowledgeRecord, ExpertMixRecordStatus, PublicExpertMixKnowledgeRecord } from "../expert-mix-knowledge";

export type ExcelCellValue = string | number | boolean | null;
export type ExcelRowData = { readonly rowNumber: number; readonly values: readonly ExcelCellValue[]; readonly isEmpty: boolean };
export type ExcelSheetData = { readonly name: string; readonly state: "visible" | "hidden" | "veryHidden"; readonly rows: readonly ExcelRowData[]; readonly mergedRanges: readonly string[]; readonly formulaCellCount: number; readonly errorCellCount: number };
export type ExpertMixWorkbookData = { readonly workbookPath: string; readonly workbookName: string; readonly sheets: readonly ExcelSheetData[] };

export type ExcelSheetInspection = {
  readonly name: string; readonly state: "visible" | "hidden" | "veryHidden"; readonly role: "PRIMARY_TOBACCO" | "PRIMARY_MIX" | "PRIMARY_COMPONENT" | "DERIVED_APP" | "ARCHIVE_OR_UNKNOWN";
  readonly rowCount: number; readonly dataRowCount: number; readonly emptyRowCount: number; readonly columnCount: number; readonly headerRowNumber: number | null;
  readonly headers: readonly string[]; readonly normalizedHeaders: readonly string[]; readonly duplicateHeaders: readonly string[]; readonly unknownHeaders: readonly string[]; readonly emptyColumnIndexes: readonly number[];
  readonly formulaCellCount: number; readonly errorCellCount: number; readonly mergedRanges: readonly string[];
};
export type ExpertMixWorkbookInspection = { readonly workbookPath: string; readonly workbookName: string; readonly sheets: readonly ExcelSheetInspection[]; readonly sheetsFound: readonly string[]; readonly sheetsMissing: readonly string[]; readonly totalRows: number; readonly totalFormulaCells: number; readonly totalErrorCells: number };

export type RawExcelEntityRow = { readonly sheet: string; readonly rowNumber: number; readonly cells: Readonly<Record<string, ExcelCellValue>> };
export type RawTobaccoRow = RawExcelEntityRow;
export type RawMixRow = RawExcelEntityRow;
export type RawMixComponentRow = RawExcelEntityRow;

export type ImportedValueSourceType = "SOURCE_STATED" | "CATALOG_FACT" | "DERIVED";
export type ImportedFrom = { readonly workbookName: string; readonly sheet: string; readonly rowNumber: number };
export type ImportedValue<T> = { readonly value: T; readonly sourceType: ImportedValueSourceType; readonly source: string; readonly sourceReference?: string; readonly confidence: ExpertKnowledgeConfidence; readonly notes?: string; readonly importedFrom: ImportedFrom; readonly originalValue: ExcelCellValue };
export type ImportedCatalogFact = ImportedValue<string | number | readonly string[]> & { readonly factType: "MANUFACTURER" | "PRODUCT_LINE" | "PRODUCT_NAME" | "DESCRIPTION" | "STRENGTH" | "EXISTENCE" };
export type ImportedObservation = ImportedValue<string> & { readonly observationType: "REAL_EXPERIENCE" | "STRENGTH" | "FREEFORM" };
export type ImportedExternalRating = { readonly originalValue: number; readonly originalScale: number; readonly normalizedValue10?: number; readonly sampleSize?: number; readonly source: string; readonly sourceReference?: string; readonly confidence: ExpertKnowledgeConfidence; readonly importedFrom: ImportedFrom };
export type ImportedDerivedCharacteristic = ImportedValue<string | number> & { readonly characteristic: string; readonly kind: "TAG_CATEGORY" | "PRELIMINARY_INFERENCE" };
export type ImportedSourceReference = { readonly source: string; readonly sourceReference?: string; readonly visibility: "INTERNAL" | "PUBLIC"; readonly importedFrom: ImportedFrom };

export type NormalizedTobaccoStagingRecord = {
  readonly stagingId: string; readonly displayName: string; readonly manufacturer: string | null; readonly productLine: string | null; readonly productName: string | null; readonly explicitCanonicalProductId: string | null;
  readonly identityStatus: ExpertMixIdentityStatus; readonly canonicalProductId: string | null; readonly manufacturerId: string | null; readonly productLineId: string | null;
  readonly catalogFacts: readonly ImportedCatalogFact[]; readonly observations: readonly ImportedObservation[]; readonly externalRatings: readonly ImportedExternalRating[]; readonly derivedCharacteristics: readonly ImportedDerivedCharacteristic[]; readonly sources: readonly ImportedSourceReference[];
  readonly raw: RawTobaccoRow;
};
export type NormalizedMixStagingRecord = {
  readonly mixId: string; readonly title: string | null; readonly status: ExpertMixRecordStatus | null; readonly proportionType: "PERCENT" | "PARTS" | "ORDER_ONLY" | "UNKNOWN"; readonly declaredTotalWeightGrams: number | null;
  readonly ratioQuality: string | null; readonly sourceUrl: string | null; readonly internalAuthor: string | null; readonly observation: string | null; readonly rating: ImportedExternalRating | null; readonly tags: readonly string[]; readonly raw: RawMixRow;
};
export type NormalizedMixComponentStagingRecord = {
  readonly mixId: string; readonly componentId: string; readonly position: number; readonly displayName: string; readonly manufacturer: string | null; readonly productLine: string | null; readonly productName: string | null; readonly explicitCanonicalProductId: string | null;
  readonly identityStatus: ExpertMixIdentityStatus; readonly canonicalProductId: string | null; readonly manufacturerId: string | null; readonly productLineId: string | null;
  readonly percentage: number | null; readonly approximatePercentage: number | null; readonly parts: number | null; readonly grams: number | null; readonly role: string | null; readonly raw: RawMixComponentRow;
};

export type ExpertMixImportIssueSeverity = "ERROR" | "WARNING" | "INFO";
export type ExpertMixImportIssueCode =
  | "WORKBOOK_NOT_FOUND" | "WORKBOOK_READ_FAILED" | "SHEET_MISSING" | "SHEET_EMPTY" | "HEADER_MISSING" | "HEADER_DUPLICATED" | "ROW_EMPTY" | "ROW_INVALID"
  | "MANUFACTURER_MISSING" | "PRODUCT_NAME_MISSING" | "PRODUCT_LINE_UNKNOWN" | "IDENTITY_NOT_FOUND" | "IDENTITY_AMBIGUOUS" | "IDENTITY_MANUFACTURER_ONLY" | "DUPLICATE_PRODUCT_CANDIDATE"
  | "MIX_ID_MISSING" | "MIX_STATUS_MISSING" | "MIX_COMPONENTS_MISSING" | "MIX_COMPONENT_ORPHANED" | "MIX_DUPLICATE_CANDIDATE" | "DUPLICATE_COMPONENT"
  | "PROPORTION_INVALID" | "PERCENT_SUM_ROUNDING" | "PERCENT_SUM_MISMATCH" | "WEIGHT_SUM_MISMATCH" | "TOTAL_WEIGHT_MISMATCH" | "NEGATIVE_VALUE" | "ZERO_VALUE" | "INVALID_NUMERIC_CELL"
  | "SOURCE_MISSING" | "SOURCE_PRIVATE" | "SOURCE_TYPE_UNKNOWN" | "CONFIDENCE_MISSING" | "PRELIMINARY_VALUE_WITHOUT_LOW_CONFIDENCE"
  | "PUBLIC_PRIVACY_LEAK" | "INTERNAL_NOTE_EXPOSED" | "PRIVATE_URL_EXPOSED" | "DOMAIN_VALIDATION_FAILED";
export type ExpertMixImportIssue = { readonly code: ExpertMixImportIssueCode; readonly severity: ExpertMixImportIssueSeverity; readonly sheet?: string; readonly rowNumber?: number; readonly entityId?: string; readonly field?: string; readonly originalValue?: ExcelCellValue; readonly normalizedValue?: ExcelCellValue; readonly message: string; readonly suggestedAction?: string };

export type ExpertMixImportOptions = {
  readonly strictMode: boolean; readonly percentageTolerance: number; readonly allowMissingOptionalSheets: boolean; readonly includeArchived: boolean; readonly includeRejected: boolean;
  readonly includePreliminaryInferences: boolean; readonly includeExternalRatings: boolean; readonly includePrivateEvidence: boolean; readonly failOnAmbiguousIdentity: boolean; readonly failOnUnresolvedIdentity: boolean; readonly importedAt?: string;
};
export type ExpertMixImportPlan = { readonly tobaccoRows: readonly RawTobaccoRow[]; readonly mixRows: readonly RawMixRow[]; readonly componentRows: readonly RawMixComponentRow[]; readonly ignoredRows: number; readonly issues: readonly ExpertMixImportIssue[] };

export type ExpertMixImportReport = {
  readonly summary: { readonly workbookPath: string; readonly workbookName: string; readonly importedAt: string | null; readonly sheetsFound: readonly string[]; readonly sheetsMissing: readonly string[]; readonly totalRowsRead: number; readonly totalRowsIgnored: number; readonly totalWarnings: number; readonly totalErrors: number };
  readonly tobacco: { readonly rowsRead: number; readonly imported: number; readonly resolved: number; readonly manufacturerOnly: number; readonly unresolved: number; readonly ambiguous: number; readonly invalid: number; readonly duplicates: number; readonly catalogFacts: number; readonly realObservations: number; readonly externalRatings: number; readonly derivedFromTags: number; readonly preliminaryInferences: number };
  readonly mixes: { readonly rowsRead: number; readonly imported: number; readonly verified: number; readonly partiallyVerified: number; readonly draft: number; readonly disputed: number; readonly rejected: number; readonly archived: number; readonly invalid: number; readonly duplicateCandidates: number };
  readonly components: { readonly rowsRead: number; readonly imported: number; readonly resolved: number; readonly manufacturerOnly: number; readonly unresolved: number; readonly ambiguous: number; readonly unchecked: number; readonly invalid: number; readonly orphaned: number };
  readonly validation: { readonly percentageSumWarnings: number; readonly weightSumWarnings: number; readonly duplicateWarnings: number; readonly identityWarnings: number; readonly missingSourceWarnings: number; readonly privacyWarnings: number };
  readonly issues: readonly ExpertMixImportIssue[];
};

export type ImportedExpertMixRegistry = { readonly records: readonly Readonly<ExpertMixKnowledgeRecord>[]; readonly tobacco: readonly Readonly<NormalizedTobaccoStagingRecord>[]; readonly report: Readonly<ExpertMixImportReport> };
export type ExpertMixImportResult = { readonly inspection: ExpertMixWorkbookInspection; readonly plan: ExpertMixImportPlan; readonly tobacco: readonly NormalizedTobaccoStagingRecord[]; readonly mixes: readonly NormalizedMixStagingRecord[]; readonly components: readonly NormalizedMixComponentStagingRecord[]; readonly rejectedMixIds: readonly string[]; readonly registry: ImportedExpertMixRegistry; readonly publicRecords: readonly PublicExpertMixKnowledgeRecord[]; readonly report: ExpertMixImportReport };
