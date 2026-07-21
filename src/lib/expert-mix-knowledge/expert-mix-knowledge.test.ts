import { describe, expect, it } from "vitest";
import {
  adaptExternalExpertMixInput, createExpertKnowledgeSourceId, createExpertMixComponentId, createExpertMixKnowledgeRegistry,
  createExpertMixRecordId, findExpertMixRecordsByManufacturerId, findExpertMixRecordsByProductId, findExpertMixRecordsByStatus,
  findExpertMixRecordsByTag, getExpertMixRecord, listExpertMixRecords, stableSerializeExpertKnowledge,
  toPublicExpertMixKnowledgeRecord, validateExpertMixKnowledgeRecord,
} from "./index";
import type { ExpertMixKnowledgeRecord, ExpertMixObservation, ExternalExpertMixInput } from "./types";

const component = (name: string, position: number, value = position === 1 ? 60 : 40) => ({
  componentId: `component-${position}-${name}`, position, rawProductName: name, canonicalProductId: `product-${name}`,
  manufacturerId: `manufacturer-${name}`, productLineId: "line-synthetic", canonicalProductName: name,
  identityStatus: "RESOLVED" as const, proportion: { type: "PERCENT" as const, value },
});
const source = (key = "base") => ({ sourceId: `source-${key}`, sourceType: "EXPERT_REVIEW" as const, internalLabel: `Private Author ${key}`, publicLabel: "Проверенный обзор", url: `https://invalid.example/${key}`, authorVisibility: "INTERNAL_ONLY" as const });
const input = (overrides: Partial<ExternalExpertMixInput> = {}): ExternalExpertMixInput => ({
  externalId: "base", status: "VERIFIED", title: " Synthetic   Mix ", components: [component("alpha", 1), component("beta", 2)],
  proportions: { type: "PERCENT" }, source: source(), evidence: [], observations: [], confidence: "HIGH", tags: [" Test ", "test"], ...overrides,
});
const valid = (value: ExternalExpertMixInput = input()): ExpertMixKnowledgeRecord => { const result = adaptExternalExpertMixInput(value); expect(result.valid).toBe(true); if (!result.valid) throw new Error("fixture invalid"); return result.record; };
const invalidCodes = (value: ExternalExpertMixInput) => { const result = adaptExternalExpertMixInput(value); expect(result.valid).toBe(false); return result.valid ? [] : result.errors.map(item => item.code); };

describe("record validation", () => {
  it("accepts a valid two-component mix", () => expect(valid().recordKind).toBe("MIX"));
  it("rejects empty components", () => expect(invalidCodes(input({ components: [] }))).toContain("EMPTY_COMPONENTS"));
  it("accepts a single component as a session with warning", () => { const result = adaptExternalExpertMixInput(input({ components: [component("alpha", 1, 100)] })); expect(result.valid).toBe(true); if (result.valid) { expect(result.record.recordKind).toBe("SINGLE_PRODUCT_SESSION"); expect(result.warnings.map(item => item.code)).toContain("SINGLE_COMPONENT_RECORD"); } });
  it("rejects duplicate positions", () => expect(invalidCodes(input({ components: [component("alpha", 1, 50), component("beta", 1, 50)] }))).toContain("DUPLICATE_COMPONENT_POSITION"));
  it("rejects duplicate component IDs", () => { const same = component("alpha", 1, 50); expect(invalidCodes(input({ components: [same, { ...component("beta", 2, 50), componentId: same.componentId }] }))).toContain("DUPLICATE_COMPONENT_ID"); });
  it("sorts components stably by explicit position", () => expect(valid(input({ components: [component("beta", 2), component("alpha", 1)] })).components.map(item => item.position)).toEqual([1, 2]));
  it("returns an immutable record", () => { const record = valid(); expect(Object.isFrozen(record)).toBe(true); expect(Object.isFrozen(record.components)).toBe(true); expect(Object.isFrozen(record.components[0])).toBe(true); });
  it("enforces the documented technical limit", () => expect(invalidCodes(input({ components: Array.from({ length: 21 }, (_, index) => component(`p${index}`, index + 1, 100 / 21)) }))).toContain("TOO_MANY_COMPONENTS"));
});

describe("proportions", () => {
  it("accepts exact 60/40", () => expect(valid().components.map(item => item.proportion)).toHaveLength(2));
  it("accepts exact 50/50", () => expect(valid(input({ components: [component("alpha", 1, 50), component("beta", 2, 50)] })).proportions.type).toBe("PERCENT"));
  it("accepts a total of 100", () => expect(adaptExternalExpertMixInput(input()).valid).toBe(true));
  it("rejects exact total 99", () => expect(invalidCodes(input({ components: [component("alpha", 1, 59), component("beta", 2, 40)] }))).toContain("PERCENT_TOTAL_MISMATCH"));
  it("rejects exact total 110", () => expect(invalidCodes(input({ components: [component("alpha", 1, 60), component("beta", 2, 50)] }))).toContain("PERCENT_TOTAL_MISMATCH"));
  it("accepts an explicitly approximate total within tolerance", () => { const components = [{ ...component("alpha", 1, 59), proportion: { type: "APPROXIMATE_PERCENT" as const, value: 59, tolerance: 1 } }, component("beta", 2, 40)]; expect(adaptExternalExpertMixInput(input({ components, proportions: { type: "PERCENT" } })).valid).toBe(true); });
  it("accepts parts 2/1 without converting them", () => { const record = valid(input({ components: [{ ...component("alpha", 1), proportion: { type: "PARTS", value: 2 } }, { ...component("beta", 2), proportion: { type: "PARTS", value: 1 } }], proportions: { type: "PARTS", totalParts: 3 } })); expect(record.components[0]?.proportion).toEqual({ type: "PARTS", value: 2 }); });
  it("rejects zero parts", () => expect(invalidCodes(input({ components: [{ ...component("alpha", 1), proportion: { type: "PARTS", value: 0 } }, { ...component("beta", 2), proportion: { type: "PARTS", value: 1 } }], proportions: { type: "PARTS" } }))).toContain("INVALID_PART_VALUE"));
  it("keeps unknown proportions unknown", () => { const result = adaptExternalExpertMixInput(input({ components: [{ ...component("alpha", 1), proportion: undefined }, { ...component("beta", 2), proportion: undefined }], proportions: { type: "UNKNOWN" } })); expect(result.valid).toBe(true); if (result.valid) expect(result.warnings.map(item => item.code)).toContain("UNKNOWN_PROPORTIONS"); });
  it("supports order-only proportions", () => expect(valid(input({ components: [{ ...component("alpha", 1), proportion: undefined }, { ...component("beta", 2), proportion: undefined }], proportions: { type: "ORDER_ONLY" } })).proportions.type).toBe("ORDER_ONLY"));
  it("does not auto-normalize invalid percentages", () => { const result = adaptExternalExpertMixInput(input({ components: [component("alpha", 1, 70), component("beta", 2, 50)] })); expect(result.valid).toBe(false); if (!result.valid) expect(result.partialRecord?.components?.map(item => item.proportion)).toEqual([{ type: "PERCENT", value: 70 }, { type: "PERCENT", value: 50 }]); });
});

describe("identity boundary", () => {
  it("accepts resolved identity with exact canonicalProductId", () => expect(valid().components[0]?.canonicalProductId).toBe("product-alpha"));
  it("accepts manufacturer-only with warning", () => { const result = adaptExternalExpertMixInput(input({ status: "PARTIALLY_VERIFIED", components: [{ ...component("alpha", 1), canonicalProductId: undefined, productLineId: undefined, identityStatus: "MANUFACTURER_ONLY" }, component("beta", 2)] })); expect(result.valid).toBe(true); if (result.valid) expect(result.warnings.map(item => item.code)).toContain("UNRESOLVED_COMPONENT"); });
  it("keeps unresolved component valid with warning", () => { const result = adaptExternalExpertMixInput(input({ status: "PARTIALLY_VERIFIED", components: [{ ...component("alpha", 1), canonicalProductId: undefined, manufacturerId: undefined, productLineId: undefined, identityStatus: "UNRESOLVED" }, component("beta", 2)] })); expect(result.valid).toBe(true); if (result.valid) expect(result.record.components[0]?.canonicalProductId).toBeUndefined(); });
  it("does not fuzzy-match raw names in the generic adapter", () => { const record = valid(input({ status: "PARTIALLY_VERIFIED", components: [{ componentId: "raw", position: 1, rawProductName: "Dark Sid Kor Lemon-ish", identityStatus: "NOT_CHECKED", proportion: { type: "PERCENT", value: 60 } }, component("beta", 2)] })); expect(record.components[0]?.canonicalProductId).toBeUndefined(); });
  it("warns when VERIFIED contains unresolved identity", () => { const result = adaptExternalExpertMixInput(input({ components: [{ ...component("alpha", 1), canonicalProductId: undefined, identityStatus: "UNRESOLVED" }, component("beta", 2)] })); expect(result.valid).toBe(true); if (result.valid) expect(result.warnings.map(item => item.code)).toContain("VERIFIED_WITH_UNRESOLVED_COMPONENT"); });
});

describe("evidence and observations", () => {
  const evidence = { evidenceId: "e-1", type: "DIRECT_STATEMENT" as const, sourceId: "source-base", timestampStartSeconds: 10, timestampEndSeconds: 20, excerpt: "private excerpt", confidence: "HIGH" as const };
  const freeform = (subject: ExpertMixObservation["subject"], evidenceIds: readonly string[] = ["e-1"], origin: ExpertMixObservation["origin"] = "SOURCE_STATED"): ExpertMixObservation => ({ observationId: "o-1", type: "FREEFORM", subject, origin, confidence: "HIGH", evidenceIds, text: "Observation" });
  it("accepts valid source reference and timestamps", () => expect(adaptExternalExpertMixInput(input({ evidence: [evidence], observations: [freeform({ type: "MIX" })] })).valid).toBe(true));
  it("normalizes an external evidence source reference to the record source", () => expect(valid(input({ evidence: [{ ...evidence, sourceId: "other" }] })).evidence[0]?.sourceId).toBe("source-base"));
  it("adapter binds external evidence to its record source", () => expect(valid(input({ evidence: [{ ...evidence, sourceId: "other" }] })).evidence[0]?.sourceId).toBe("source-base"));
  it("rejects invalid timestamp range", () => expect(invalidCodes(input({ evidence: [{ ...evidence, timestampStartSeconds: 20, timestampEndSeconds: 10 }] }))).toContain("INVALID_TIMESTAMP_RANGE"));
  it("rejects duplicate evidence IDs", () => expect(invalidCodes(input({ evidence: [evidence, evidence] }))).toContain("DUPLICATE_EVIDENCE_ID"));
  it("accepts observation references to known evidence", () => expect(adaptExternalExpertMixInput(input({ evidence: [evidence], observations: [freeform({ type: "MIX" })] })).valid).toBe(true));
  it("rejects unknown evidence reference", () => expect(invalidCodes(input({ observations: [freeform({ type: "MIX" }, ["missing"])] }))).toContain("UNKNOWN_EVIDENCE_REFERENCE"));
  it("supports MIX subject", () => expect(valid(input({ evidence: [evidence], observations: [freeform({ type: "MIX" })] })).observations[0]?.subject.type).toBe("MIX"));
  it("supports COMPONENT subject", () => expect(valid(input({ evidence: [evidence], observations: [freeform({ type: "COMPONENT", componentId: "component-1-alpha" })] })).observations[0]?.subject.type).toBe("COMPONENT"));
  it("supports COMPONENT_PAIR subject", () => expect(valid(input({ evidence: [evidence], observations: [freeform({ type: "COMPONENT_PAIR", componentIds: ["component-1-alpha", "component-2-beta"] })] })).observations[0]?.subject.type).toBe("COMPONENT_PAIR"));
  it("rejects unknown component reference", () => expect(invalidCodes(input({ evidence: [evidence], observations: [freeform({ type: "COMPONENT", componentId: "missing" })] }))).toContain("UNKNOWN_COMPONENT_REFERENCE"));
  it.each(["SOURCE_STATED", "EDITOR_INTERPRETED", "DERIVED"] as const)("preserves %s origin", origin => expect(valid(input({ evidence: [evidence], observations: [freeform({ type: "MIX" }, ["e-1"], origin)] })).observations[0]?.origin).toBe(origin));
  it("does not derive dominance from percentage", () => expect(valid().observations).toEqual([]));
});

describe("evaluation and preparation", () => {
  it.each([[10, 8], [5, 4], [100, 95]] as const)("preserves rating %s/%s scale", (scale, value) => { const record = valid(input({ evaluation: { verdict: "GOOD", rating: { scale, value } } })); expect(record.evaluation?.rating).toEqual({ scale, value }); });
  it("rejects 11/10", () => expect(invalidCodes(input({ evaluation: { verdict: "GOOD", rating: { scale: 10, value: 11 } } }))).toContain("INVALID_RATING"));
  it("preserves qualitative rating", () => expect(valid(input({ evaluation: { verdict: "MIXED", rating: { scale: "QUALITATIVE", value: "MIXED" } } })).evaluation?.rating).toEqual({ scale: "QUALITATIVE", value: "MIXED" }));
  it("does not convert rating scales", () => expect(valid(input({ evaluation: { verdict: "EXCELLENT", rating: { scale: 100, value: 95 } } })).evaluation?.rating).not.toEqual({ scale: 10, value: 9.5 }));
  it("accepts valid bowl and coals", () => expect(valid(input({ preparation: { bowl: { capacityGrams: 18, packingStyle: "FLUFF" }, coals: { initialCount: 3, workingCount: 2 }, warmupMinutes: 6 } })).preparation?.bowl?.capacityGrams).toBe(18));
  it("rejects negative bowl capacity", () => expect(invalidCodes(input({ preparation: { bowl: { capacityGrams: -1 } } }))).toContain("INVALID_PREPARATION_VALUE"));
  it("rejects coal count above ten", () => expect(invalidCodes(input({ preparation: { coals: { initialCount: 11 } } }))).toContain("INVALID_PREPARATION_VALUE"));
  it("rejects negative warmup", () => expect(invalidCodes(input({ preparation: { warmupMinutes: -1 } }))).toContain("INVALID_PREPARATION_VALUE"));
  it("keeps preparation optional", () => expect(valid().preparation).toBeUndefined());
});

describe("privacy mapper", () => {
  it("removes internalLabel, hidden URL, record notes and all evidence", () => { const record = valid(input({ notes: "internal notes", evidence: [{ evidenceId: "e-private", type: "DIRECT_STATEMENT", sourceId: "source-base", excerpt: "secret", confidence: "HIGH" }] })); const result = toPublicExpertMixKnowledgeRecord(record); expect(result.source).not.toHaveProperty("internalLabel"); expect(result.source).not.toHaveProperty("url"); expect(result).not.toHaveProperty("notes"); expect(result).not.toHaveProperty("evidence"); });
  it("uses a neutral public label for INTERNAL_ONLY sources", () => expect(toPublicExpertMixKnowledgeRecord(valid()).source.label).toBe("Проверенный обзор"));
  it("does not expose a private author name", () => expect(JSON.stringify(toPublicExpertMixKnowledgeRecord(valid()))).not.toContain("Private Author"));
  it("retains INTERNAL_ONLY visibility without identity", () => expect(toPublicExpertMixKnowledgeRecord(valid()).source.authorVisibility).toBe("INTERNAL_ONLY"));
  it("anonymizes label and URL for PUBLIC_ANONYMOUS", () => { const record = valid(input({ source: { ...source("anonymous"), authorVisibility: "PUBLIC_ANONYMOUS", publicLabel: "Real Channel Name" } })); const result = toPublicExpertMixKnowledgeRecord(record); expect(result.source.label).toBe("Проверенный обзор"); expect(result.source).not.toHaveProperty("url"); });
});

describe("read-only registry", () => {
  const records = [valid(input({ externalId: "z", source: source("z"), tags: ["Dessert"] })), valid(input({ externalId: "a", source: source("a"), status: "ARCHIVED", components: [component("gamma", 1), component("beta", 2)] }))];
  it("creates, gets and checks records", () => { const registry = createExpertMixKnowledgeRegistry(records); expect(getExpertMixRecord(registry, records[0]!.id)?.id).toBe(records[0]!.id); expect(registry.has(records[1]!.id)).toBe(true); });
  it("rejects duplicate record IDs", () => expect(() => createExpertMixKnowledgeRegistry([records[0]!, records[0]!])).toThrow(/Duplicate/));
  it("filters by product, manufacturer, status and tag", () => { const registry = createExpertMixKnowledgeRegistry(records); expect(findExpertMixRecordsByProductId(registry, "product-alpha")).toHaveLength(1); expect(findExpertMixRecordsByManufacturerId(registry, "manufacturer-gamma")).toHaveLength(1); expect(findExpertMixRecordsByStatus(registry, "ARCHIVED")).toHaveLength(1); expect(findExpertMixRecordsByTag(registry, " dessert ")).toHaveLength(1); });
  it("sorts output stably by ID", () => { const ids = createExpertMixKnowledgeRegistry(records).list().map(record => record.id); expect(ids).toEqual([...ids].sort()); });
  it("filters active statuses", () => expect(listExpertMixRecords(createExpertMixKnowledgeRegistry(records), { active: true }).every(record => record.status !== "ARCHIVED")).toBe(true));
  it("deep-freezes stored records and exposes no map", () => { const registry = createExpertMixKnowledgeRegistry(records); expect(Object.isFrozen(registry.get(records[0]!.id))).toBe(true); expect(Object.isFrozen(registry.get(records[0]!.id)?.components)).toBe(true); expect(registry).not.toHaveProperty("records"); });
});

describe("deterministic IDs and adapter", () => {
  it("creates stable record and component IDs", () => { expect(createExpertMixRecordId({ source: "a", mix: [1, 2] })).toBe(createExpertMixRecordId({ mix: [1, 2], source: "a" })); expect(createExpertMixComponentId("Кокос")).toBe(createExpertMixComponentId("Кокос")); });
  it("supports Unicode and Cyrillic", () => expect(createExpertKnowledgeSourceId({ автор: "Ёж — эксперт" })).toMatch(/^emks\./));
  it("ignores object key order", () => expect(stableSerializeExpertKnowledge({ b: 2, a: 1 })).toBe(stableSerializeExpertKnowledge({ a: 1, b: 2 })));
  it("keeps source-specific record identity", () => expect(valid(input({ source: source("one") })).id).not.toBe(valid(input({ source: source("two") })).id));
  it("normalizes safe title/tags but preserves raw product name", () => { const record = valid(input({ title: " A   title ", components: [{ ...component("alpha", 1), rawProductName: "  Raw   Product  " }, component("beta", 2)], tags: ["  TEST "] })); expect(record.title).toBe("A title"); expect(record.tags).toEqual(["test"]); expect(record.components[0]?.rawProductName).toBe("  Raw   Product  "); });
  it("ignores external metadata unless explicitly mapped", () => expect(valid(input({ metadata: { secret: "not-domain" } }))).not.toHaveProperty("metadata"));
  it("returns typed invalid result", () => expect(adaptExternalExpertMixInput(input({ components: [] }))).toMatchObject({ valid: false, errors: [{ code: "EMPTY_COMPONENTS" }] }));
  it("has no filesystem or Prisma fields in adapted output", () => { const json = JSON.stringify(valid()); expect(json).not.toContain("DATABASE_URL"); expect(json).not.toContain("metadata"); });
});

describe("direct runtime validation", () => {
  it("rejects evidence that references another source", () => { const record = structuredClone(valid()); (record.evidence as unknown as { sourceId: string }[]).push({ evidenceId: "foreign", type: "DIRECT_STATEMENT", sourceId: "foreign-source", confidence: "HIGH" } as never); expect(validateExpertMixKnowledgeRecord(record)).toMatchObject({ valid: false, errors: expect.arrayContaining([expect.objectContaining({ code: "UNKNOWN_EVIDENCE_REFERENCE" })]) }); });
  it("rejects duplicate observation IDs", () => { const base = valid(); const observation: ExpertMixObservation = { observationId: "same", type: "FREEFORM", subject: { type: "MIX" }, origin: "SOURCE_STATED", confidence: "LOW", evidenceIds: [], text: "x" }; expect(validateExpertMixKnowledgeRecord({ ...base, observations: [observation, observation] })).toMatchObject({ valid: false, errors: expect.arrayContaining([expect.objectContaining({ code: "DUPLICATE_OBSERVATION_ID" })]) }); });
});
