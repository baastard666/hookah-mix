import { describe, expect, it } from "vitest";
import type { UnresolvedIdentityGroup, UnresolvedIdentityReport } from "../expert-mix-knowledge-import";
import {
  applyTobaccoIdentityDecisions, auditPublicTobaccoIdentityDecisions, auditTobaccoIdentityDecisions, compareTobaccoIdentityCoverage,
  createCanonicalTobaccoProductId, createDecisionFixture, createTobaccoIdentityDecisionFixtures, createTobaccoIdentityDecisionRegistry,
  createTobaccoIdentityReviewPlan, filterCanonicalTobaccoProducts, getTobaccoIdentityDecision, mapTobaccoIdentityDecisionToPublic,
  parseTobaccoIdentityReviewPlanJson, resolveIdentityWithDecisions, reviewPlanToCsv, reviewPlanToJson, reviewPlanToMarkdown,
  serializeTobaccoIdentityDecisionRegistry, validateTobaccoIdentityDecision, validateTobaccoIdentityDecisionRegistry,
} from "./index";
import type { DecisionApplicableIdentityRecord, TobaccoIdentityDecision, TobaccoIdentitySourcePriority } from "./types";

const fixtures = createTobaccoIdentityDecisionFixtures();
const record = (decision: TobaccoIdentityDecision, overrides: Partial<DecisionApplicableIdentityRecord> = {}): DecisionApplicableIdentityRecord => ({
  recordId: `record-${decision.id}`, scope: "COMPONENT", sourcePriority: decision.sourceIdentity.sourcePriority, usedInVerifiedMix: true,
  manufacturer: decision.sourceIdentity.manufacturer, productLine: decision.sourceIdentity.productLine, productName: decision.sourceIdentity.productName,
  identityStatus: "UNRESOLVED", manufacturerId: null, productLineId: null, canonicalProductId: null, canonicalProductName: null,
  confidence: null, evidenceTypes: [], confirmedDecision: false, ...overrides,
});
const group = (groupId: string, priority: "P0" | "P1" | "P2" | "P3", overrides: Partial<UnresolvedIdentityGroup> = {}): UnresolvedIdentityGroup => ({
  groupId, normalizedIdentity: { manufacturer: "brand", productLine: "", productName: groupId }, displayIdentity: { manufacturer: "Brand", productLine: null, productName: groupId },
  occurrenceCount: 1, componentOccurrenceCount: priority === "P3" ? 0 : 1, catalogOccurrenceCount: priority === "P3" ? 1 : 0, verifiedMixCount: priority === "P0" || priority === "P1" ? 1 : 0,
  currentStatus: priority === "P1" ? "MANUFACTURER_ONLY" : "UNRESOLVED", observedStatuses: [priority === "P1" ? "MANUFACTURER_ONLY" : "UNRESOLVED"], manufacturerKnown: priority === "P1", productLineKnown: false,
  hasExactAliasCandidates: false, exactAliasCandidates: [], missingFields: ["productLine"], priority, ...overrides,
});
const unresolvedReport = (groups: readonly UnresolvedIdentityGroup[]): UnresolvedIdentityReport => ({ reportVersion: "unresolved-identity-report-v1", grouping: "exact-normalized-manufacturer-productLine-productName", sourceOrder: ["Mix_Components", "ОСНОВНАЯ_БАЗА"], statusRule: "component-statuses-first-AMBIGUOUS-UNRESOLVED-MANUFACTURER_ONLY-NOT_CHECKED-RESOLVED", registryMatching: "exact-normalized-canonical-or-alias-only", fuzzyMatching: false, canonicalIdAssignment: false, summary: { componentRows: groups.reduce((sum, item) => sum + item.componentOccurrenceCount, 0), catalogRows: groups.reduce((sum, item) => sum + item.catalogOccurrenceCount, 0), groupCount: groups.length, priorityCounts: { P0: groups.filter(item => item.priority === "P0").length, P1: groups.filter(item => item.priority === "P1").length, P2: groups.filter(item => item.priority === "P2").length, P3: groups.filter(item => item.priority === "P3").length } }, groups, priorityList: { P0: groups.filter(item => item.priority === "P0").map(item => item.groupId), P1: groups.filter(item => item.priority === "P1").map(item => item.groupId), P2: groups.filter(item => item.priority === "P2").map(item => item.groupId), P3: groups.filter(item => item.priority === "P3").map(item => item.groupId) } });

describe("canonical identity decisions", () => {
  it("creates deterministic canonical ID with product line", () => expect(createCanonicalTobaccoProductId("darkside", "darkside-core", "Blueberry")).toBe("darkside-core-blueberry"));
  it("creates deterministic canonical ID without product line", () => expect(createCanonicalTobaccoProductId("BlackBurn", null, "Raspberry  Shock")).toBe("blackburn-raspberry-shock"));
  it("is Unicode and case safe", () => expect(createCanonicalTobaccoProductId("НАШ", null, "Лаванда")).toBe(createCanonicalTobaccoProductId("наш", null, "  лаванда ")));
  it("rejects empty canonical input", () => expect(createCanonicalTobaccoProductId("brand", null, "---")).toBeNull());
  it("validates RESOLVED with line", () => expect(validateTobaccoIdentityDecision(fixtures.withLine)).toMatchObject({ valid: true, applicable: true }));
  it("validates RESOLVED without line", () => expect(validateTobaccoIdentityDecision(fixtures.withoutLine)).toMatchObject({ valid: true, applicable: true }));
  it("rejects a line when interpretation confirms none", () => expect(validateTobaccoIdentityDecision(createDecisionFixture({ productLineId: "core", interpretation: "CONFIRMED_NONE" })).issues.map(item => item.code)).toContain("PRODUCT_LINE_UNCONFIRMED"));
  it("validates MANUFACTURER_ONLY without canonical ID", () => expect(validateTobaccoIdentityDecision(fixtures.manufacturerOnly)).toMatchObject({ valid: true, applicable: true }));
  it("stores UNRESOLVED as non-applicable", () => expect(validateTobaccoIdentityDecision(fixtures.unresolved)).toMatchObject({ valid: true, applicable: false }));
  it("stores AMBIGUOUS as non-applicable", () => expect(validateTobaccoIdentityDecision(fixtures.ambiguous)).toMatchObject({ valid: true, applicable: false }));
  it("supports confirmed REJECTED", () => expect(validateTobaccoIdentityDecision(fixtures.rejected)).toMatchObject({ valid: true, applicable: true }));
  it("does not apply unconfirmed review", () => expect(validateTobaccoIdentityDecision(fixtures.unconfirmed).applicable).toBe(false));
  it("rejects missing evidence", () => expect(validateTobaccoIdentityDecision(fixtures.missingEvidence).issues.map(item => item.code)).toContain("DECISION_EVIDENCE_MISSING"));
  it("rejects evidence without URL or internal reference", () => expect(validateTobaccoIdentityDecision(createDecisionFixture({ id: "missing-evidence-location", evidence: [{ sourceType: "VERIFIED_RETAIL_CATALOG", sourceReference: "catalog", confidence: "MEDIUM", checkedAt: "2026-01-01", publicSafe: true }] })).issues.map(item => item.code)).toContain("DECISION_EVIDENCE_MISSING"));
  it("rejects missing confidence", () => expect(validateTobaccoIdentityDecision(fixtures.missingConfidence).issues.map(item => item.code)).toContain("DECISION_CONFIDENCE_MISSING"));
  it("rejects missing canonical ID", () => expect(validateTobaccoIdentityDecision(fixtures.missingCanonicalProductId).issues.map(item => item.code)).toContain("DECISION_CANONICAL_ID_MISSING"));
  it("forbids fictitious product lines", () => expect(validateTobaccoIdentityDecision(createDecisionFixture({ productLine: "default", productLineId: "default", interpretation: "CONFIRMED" })).issues.map(item => item.code)).toContain("PRODUCT_LINE_FICTITIOUS"));
  it("does not apply P2", () => expect(validateTobaccoIdentityDecision(fixtures.p2Blocked).issues.map(item => item.code)).toContain("P2_P3_DECISION_NOT_ALLOWED"));
  it("does not apply P3", () => expect(validateTobaccoIdentityDecision(fixtures.p3Blocked).issues.map(item => item.code)).toContain("P2_P3_DECISION_NOT_ALLOWED"));
});

describe("immutable registry and resolver", () => {
  it("indexes by id, source group, exact identity, canonical ID and status", () => {
    const registry = createTobaccoIdentityDecisionRegistry([fixtures.withLine, fixtures.withoutLine]);
    expect(registry.getById(fixtures.withLine.id).status).toBe("FOUND");
    expect(registry.getBySourceGroupId(fixtures.withLine.sourceIdentity.sourceGroupId).status).toBe("FOUND");
    expect(registry.getBySourceIdentity("DARKSIDE", "core", "blueberry").status).toBe("FOUND");
    expect(registry.getByCanonicalProductId("darkside-core-blueberry").status).toBe("FOUND");
    expect(registry.getByStatus("RESOLVED")).toHaveLength(2);
    expect(Object.isFrozen(registry.getByStatus("RESOLVED"))).toBe(true);
  });
  it("returns typed NOT_FOUND", () => expect(getTobaccoIdentityDecision(createTobaccoIdentityDecisionRegistry([]), { manufacturer: "none", productName: "none" })).toEqual({ status: "NOT_FOUND" }));
  it("detects duplicate decisions", () => expect(validateTobaccoIdentityDecisionRegistry([fixtures.withoutLine, fixtures.duplicate]).map(item => item.code)).toContain("DECISION_DUPLICATE"));
  it("detects conflicting exact decisions", () => expect(validateTobaccoIdentityDecisionRegistry([fixtures.withoutLine, fixtures.conflict]).map(item => item.code)).toContain("DECISION_CONFLICT"));
  it("detects canonical ID collision", () => expect(auditTobaccoIdentityDecisions([fixtures.collisionA, fixtures.collisionB]).map(item => item.code)).toContain("CANONICAL_ID_COLLISION"));
  it("throws on collision", () => expect(() => createTobaccoIdentityDecisionRegistry([fixtures.collisionA, fixtures.collisionB])).toThrow());
  it("keeps НАШ and Dogma separate", () => {
    const registry = createTobaccoIdentityDecisionRegistry([fixtures.nashLavender, fixtures.dogmaLavender]);
    expect(registry.getBySourceIdentity("НАШ", null, "Лаванда")).toMatchObject({ status: "FOUND", decision: { decision: { manufacturerId: "nash" } } });
    expect(registry.getBySourceIdentity("Dogma", null, "Крымская лаванда")).toMatchObject({ status: "FOUND", decision: { decision: { manufacturerId: "dogma" } } });
  });
  it("exact manufacturer alias alone does not resolve product", () => expect(resolveIdentityWithDecisions({ manufacturer: "MustHave", productLine: null, productName: "Unconfirmed Product" }, createTobaccoIdentityDecisionRegistry([fixtures.exactManufacturerAliasOnly]))).toMatchObject({ source: "EXISTING_RESOLVER", resolution: { status: "MANUFACTURER_ONLY" } }));
  it("does not split potentially composite manufacturer/line values", () => expect([fixtures.elementEarth, fixtures.deusPerfume, fixtures.mrBrew].every(item => item.decision.status === "UNRESOLVED" && item.sourceIdentity.productLineInterpretation === "EMBEDDED_IN_MANUFACTURER")).toBe(true));
  it("confirmed no-line decision resolves before old resolver", () => expect(resolveIdentityWithDecisions({ manufacturer: "BlackBurn", productLine: null, productName: "Raspberry Shock" }, createTobaccoIdentityDecisionRegistry([fixtures.withoutLine]))).toMatchObject({ source: "DECISION", status: "RESOLVED", productLineId: null }));
  it("is deeply immutable and detached from input", () => {
    const source = structuredClone(fixtures.withoutLine); const registry = createTobaccoIdentityDecisionRegistry([source]);
    (source.decision.aliases as string[]).push("mutated");
    expect(registry.list()[0]?.decision.aliases).toEqual([]);
    expect(Object.isFrozen(registry.list()[0]?.decision.aliases)).toBe(true);
  });
  it("serializes deterministically", () => {
    const first = serializeTobaccoIdentityDecisionRegistry(createTobaccoIdentityDecisionRegistry([fixtures.withoutLine]));
    const second = serializeTobaccoIdentityDecisionRegistry(createTobaccoIdentityDecisionRegistry([fixtures.withoutLine]));
    expect(first).toBe(second);
  });
  it("ignores operational timestamps in deterministic serialization", () => {
    const changed: TobaccoIdentityDecision = { ...fixtures.withoutLine, review: { ...fixtures.withoutLine.review, reviewedAt: "2030-01-01" }, metadata: { ...fixtures.withoutLine.metadata, createdAt: "2030-01-01" } };
    expect(serializeTobaccoIdentityDecisionRegistry(createTobaccoIdentityDecisionRegistry([changed]))).toBe(serializeTobaccoIdentityDecisionRegistry(createTobaccoIdentityDecisionRegistry([fixtures.withoutLine])));
  });
});

describe("review plan", () => {
  const report = unresolvedReport([
    group("p0-rest", "P0"), group("p1-first", "P1"), group("p0-frequent", "P0", { occurrenceCount: 3 }), group("p0-multi", "P0", { verifiedMixCount: 2 }),
    group("p2-excluded", "P2"), group("p3-excluded", "P3"),
  ]);
  const plan = createTobaccoIdentityReviewPlan(report);
  it("includes only P1 then prioritized P0", () => expect(plan.records.map(item => item.groupId)).toEqual(["p1-first", "p0-multi", "p0-frequent", "p0-rest"]));
  it("excludes P2 and P3", () => expect(plan.records.some(item => item.priority === "P2" || item.priority === "P3")).toBe(false));
  it("keeps three USER_PRIORITY records separately", () => expect(plan.userPriority).toHaveLength(3));
  it("does not propose canonical IDs", () => expect([...plan.records, ...plan.userPriority].every(item => item.canonicalProductId === null && item.decisionState === "UNREVIEWED")).toBe(true));
  it("is deeply immutable", () => expect(Object.isFrozen(plan.records)).toBe(true));
  it("serializes JSON, CSV and Markdown", () => { expect(parseTobaccoIdentityReviewPlanJson(reviewPlanToJson(plan))).toEqual(plan); expect(reviewPlanToCsv(plan)).toContain("canonicalProductId"); expect(reviewPlanToMarkdown(plan)).toContain("USER_PRIORITY"); });
  it("rejects invalid review JSON", () => expect(() => parseTobaccoIdentityReviewPlanJson("{}")).toThrow());
});

describe("application, coverage, filters and privacy", () => {
  it("applies only confirmed decision", () => {
    const applied = applyTobaccoIdentityDecisions([record(fixtures.withoutLine), record(fixtures.unconfirmed)], createTobaccoIdentityDecisionRegistry([fixtures.withoutLine, fixtures.unconfirmed]));
    expect(applied).toMatchObject({ appliedDecisionCount: 1, skippedDecisionCount: 1 });
    expect(applied.records[0]).toMatchObject({ identityStatus: "RESOLVED", productLineId: null, confirmedDecision: true });
  });
  it("coverage improves only by applied decisions", () => {
    const before = [record(fixtures.withoutLine), record(fixtures.unconfirmed)];
    const comparison = compareTobaccoIdentityCoverage(before, applyTobaccoIdentityDecisions(before, createTobaccoIdentityDecisionRegistry([fixtures.withoutLine, fixtures.unconfirmed])));
    expect(comparison).toMatchObject({ resolvedDelta: 1, unresolvedDelta: -1, appliedDecisionCount: 1 });
  });
  it("coverage separates catalog, components, VERIFIED and USER_PRIORITY", () => {
    const before = [record(fixtures.withoutLine), record(fixtures.unconfirmed, { scope: "CATALOG", usedInVerifiedMix: false }), record(fixtures.userPriority, { scope: "USER_PRIORITY" })];
    const comparison = compareTobaccoIdentityCoverage(before, applyTobaccoIdentityDecisions(before, createTobaccoIdentityDecisionRegistry([fixtures.withoutLine, fixtures.unconfirmed, fixtures.userPriority])));
    expect(comparison.componentsBefore.unresolved).toBe(1); expect(comparison.catalogBefore.unresolved).toBe(1); expect(comparison.verifiedComponents.before.unresolved).toBe(1); expect(comparison.userPriority.before.unresolved).toBe(1);
  });
  it.each([
    ["manufacturerId", { manufacturerId: "blackburn" }], ["productLineId", { productLineId: null }], ["canonicalProductId", { canonicalProductId: "blackburn-raspberry-shock" }],
    ["identityStatus", { identityStatus: "RESOLVED" as const }], ["confidence", { confidence: "HIGH" as const }], ["evidenceType", { evidenceType: "INTERNAL_EXPERT_CONFIRMATION" as const }],
    ["sourcePriority", { sourcePriority: "P1" as TobaccoIdentitySourcePriority }], ["usedInVerifiedMix", { usedInVerifiedMix: true }], ["confirmed", { confirmedDecisionsOnly: true }],
  ])("filters by %s", (_name, filter) => {
    const applied = applyTobaccoIdentityDecisions([record(fixtures.withoutLine)], createTobaccoIdentityDecisionRegistry([fixtures.withoutLine]));
    expect(filterCanonicalTobaccoProducts(applied.records, filter)).toHaveLength(1);
  });
  it("filters unresolved only", () => expect(filterCanonicalTobaccoProducts([record(fixtures.unconfirmed)], { unresolvedOnly: true })).toHaveLength(1));
  it("public mapping strips private evidence and reviewer data", () => {
    const output = [mapTobaccoIdentityDecisionToPublic(fixtures.privateEvidence)]; const json = JSON.stringify(output);
    expect(json).not.toContain("private.example"); expect(json).not.toContain("private notes"); expect(json).not.toContain("author-real-name");
    expect(auditPublicTobaccoIdentityDecisions(output, ["private.example", "private notes", "author-real-name"])).toEqual([]);
  });
  it("public privacy audit catches an explicitly supplied leaked token", () => expect(auditPublicTobaccoIdentityDecisions([mapTobaccoIdentityDecisionToPublic(fixtures.withoutLine)], ["blackburn-raspberry-shock"]).map(item => item.code)).toContain("PUBLIC_PRIVATE_REFERENCE_EXPOSED"));
});
