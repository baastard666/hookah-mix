import { adaptExternalExpertMixInput } from "./adapters";
import { createExpertKnowledgeEvidenceId } from "./ids";
import type { ExpertMixKnowledgeRecord, ExternalExpertMixInput } from "./types";

const source = (key: string, type: ExternalExpertMixInput["source"]["sourceType"] = "EXPERT_REVIEW"): ExternalExpertMixInput["source"] => ({ sourceId: `synthetic-source-${key}`, sourceType: type, internalLabel: `Synthetic private author ${key}`, publicLabel: "Проверенный обзор", authorVisibility: "INTERNAL_ONLY", url: `https://invalid.example/${key}`, language: "ru" });
const component = (name: string, position: number, percent?: number) => ({ componentId: `synthetic-component-${position}-${name.toLowerCase().replace(/\s+/g, "-")}`, position, rawProductName: name, canonicalProductId: `synthetic-${name.toLowerCase().replace(/\s+/g, "-")}`, manufacturerId: "synthetic-manufacturer", productLineId: "synthetic-line", canonicalProductName: name, identityStatus: "RESOLVED" as const, ...(percent === undefined ? {} : { proportion: { type: "PERCENT" as const, value: percent } }) });
const external = (key: string, overrides: Partial<ExternalExpertMixInput> = {}): ExternalExpertMixInput => ({ externalId: key, title: `Synthetic fixture ${key}`, status: "VERIFIED", components: [component("Alpha", 1, 60), component("Beta", 2, 40)], proportions: { type: "PERCENT" }, source: source(key), observations: [], evidence: [], confidence: "HIGH", tags: ["synthetic", "test"], ...overrides });
const valid = (input: ExternalExpertMixInput): ExpertMixKnowledgeRecord => { const result = adaptExternalExpertMixInput(input); if (!result.valid) throw new Error(`Invalid synthetic fixture: ${result.errors.map(item => item.code).join(", ")}`); return result.record; };

const evidenceId = createExpertKnowledgeEvidenceId({ fixture: "observations", statement: 1 });
export const SYNTHETIC_EXPERT_MIX_FIXTURES: readonly ExpertMixKnowledgeRecord[] = [
  valid(external("resolved-two")),
  valid(external("partially-resolved", { status: "PARTIALLY_VERIFIED", components: [component("Alpha", 1, 50), { componentId: "unresolved-beta", position: 2, rawProductName: "Неизвестный вкус", identityStatus: "UNRESOLVED", proportion: { type: "PERCENT", value: 50 } }], confidence: "MEDIUM" })),
  valid(external("percent-60-40")),
  valid(external("parts-2-1", { components: [{ ...component("Alpha", 1), proportion: { type: "PARTS", value: 2 } }, { ...component("Beta", 2), proportion: { type: "PARTS", value: 1 } }], proportions: { type: "PARTS", totalParts: 3 } })),
  valid(external("unknown-proportions", { components: [component("Alpha", 1), component("Beta", 2)], proportions: { type: "UNKNOWN" }, confidence: "UNKNOWN" })),
  valid(external("preparation", { preparation: { bowl: { type: "турка", material: "глина", capacityGrams: 18, packingStyle: "FLUFF" }, heatManagement: { type: "HMD" }, coals: { initialCount: 3, workingCount: 2, sizeMm: 25 }, warmupMinutes: 6, tobaccoPreparation: { actions: ["MIXED_TOGETHER", "FLUFFED"] } } })),
  valid(external("source-stated", { evidence: [{ evidenceId, type: "DIRECT_STATEMENT", sourceId: "replaced-by-adapter", summary: "Synthetic statement", confidence: "HIGH" }], observations: [{ observationId: "synthetic-observation-source", type: "FREEFORM", subject: { type: "MIX" }, origin: "SOURCE_STATED", confidence: "HIGH", evidenceIds: [evidenceId], text: "Синтетическое наблюдение" }] })),
  valid(external("editor-interpretation", { observations: [{ observationId: "synthetic-observation-editor", type: "FREEFORM", subject: { type: "MIX" }, origin: "EDITOR_INTERPRETED", confidence: "LOW", evidenceIds: [], text: "Синтетическая редакторская интерпретация" }] })),
  valid(external("disputed", { status: "DISPUTED", confidence: "LOW" })),
  valid(external("single-product", { components: [component("Alpha", 1, 100)], proportions: { type: "PERCENT" } })),
];

export const SYNTHETIC_INVALID_PERCENT_120_INPUT = external("invalid-120", { components: [component("Alpha", 1, 60), component("Beta", 2, 60)] });
export const SYNTHETIC_INVALID_COMPONENT_REFERENCE_INPUT = external("invalid-reference", { observations: [{ observationId: "synthetic-invalid-reference", type: "FREEFORM", subject: { type: "COMPONENT", componentId: "missing-component" }, origin: "SOURCE_STATED", confidence: "MEDIUM", evidenceIds: [], text: "Invalid synthetic reference" }] });
export const SYNTHETIC_EXPERT_MIX_FIXTURE_COUNT = 12;
