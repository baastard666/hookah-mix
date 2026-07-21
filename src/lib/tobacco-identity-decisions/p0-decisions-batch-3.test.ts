import { describe, expect, it } from "vitest";
import {
  applyTobaccoIdentityDecisions,
  ASCII_CANONICAL_PRODUCT_ID_PATTERN,
  auditPublicTobaccoIdentityDecisions,
  auditTobaccoIdentityDecisions,
  LEGACY_CANONICAL_PRODUCT_ID_ALIASES,
  mapTobaccoIdentityDecisionToPublic,
  P0_IDENTITY_DECISIONS_BATCH_1,
  P0_IDENTITY_DECISIONS_BATCH_2,
  P0_IDENTITY_DECISIONS_BATCH_3,
  P1_IDENTITY_DECISIONS_BATCH_1,
  TOBACCO_IDENTITY_DECISIONS,
  TOBACCO_IDENTITY_DECISION_REGISTRY,
  validateTobaccoIdentityDecision,
} from ".";
import type { DecisionApplicableIdentityRecord, TobaccoIdentityDecision } from "./types";

const expected = [
  ["identity-group-0078", "Husky", "Маракуйя", "husky-passion-fruit", "Passion Fruit", "Маракуйя"],
  ["identity-group-0029", "Jam", "Арбузный Rondo", "jam-arbuznyi-rondo", "Арбузный рондо", "Арбузный Rondo"],
  ["identity-group-0104", "Jam", "Гранатовый сок", "jam-granatovyi-sok", "Гранатовый сок", null],
  ["identity-group-0111", "Jam", "Конфеты с ананасом", "jam-konfety-s-ananasom", "Конфеты с ананасом", null],
  ["identity-group-0070", "Jam", "Красная смородина", "jam-krasnaya-smorodina", "Красная смородина", null],
  ["identity-group-0030", "Jam", "Спелая маракуйя", "jam-spelaya-marakuiya", "Спелая маракуйя", null],
  ["identity-group-0102", "MattPear", "Ginger Feel", "mattpear-ginger-feel", "Ginger Feel", null],
  ["identity-group-0042", "OVERDOSE", "Apple Juicy", "overdose-apple-juicy", "Apple Juicy", null],
  ["identity-group-0071", "OVERDOSE", "Coffee", "overdose-coffee", "Coffee", null],
  ["identity-group-0026", "OVERDOSE", "Jelly Grape", "overdose-jelly-grape", "Jelly Grape", null],
  ["identity-group-0059", "OVERDOSE", "Клубника", "overdose-strawberry", "Strawberry", "Клубника"],
  ["identity-group-0035", "OVERDOSE", "Самаркандская дыня", "overdose-samarkand-melon", "Samarkand Melon", "Самаркандская дыня"],
  ["identity-group-0021", "OVERDOSE", "Чай масала", "overdose-masala-tea", "Masala Tea", "Чай масала"],
  ["identity-group-0110", "Peter Ralf", "Dolche de Lechee", "peter-ralf-dolce-de-lechee", "Dolce de Lechee", "Dolche de Lechee"],
  ["identity-group-0043", "Sapphire", "Bitter Cherry", "sapphire-crown-bitter-cherry", "Bitter Cherry", null],
] as const;

const record = (decision: TobaccoIdentityDecision): DecisionApplicableIdentityRecord => ({
  recordId: `record-${decision.id}`,
  scope: "COMPONENT",
  sourcePriority: "P0",
  usedInVerifiedMix: true,
  manufacturer: decision.sourceIdentity.manufacturer,
  productLine: decision.sourceIdentity.productLine,
  productName: decision.sourceIdentity.productName,
  identityStatus: "UNRESOLVED",
  manufacturerId: null,
  productLineId: null,
  canonicalProductId: null,
  canonicalProductName: null,
  confidence: null,
  evidenceTypes: [],
  confirmedDecision: false,
});

describe("P0 identity decisions batch 3", () => {
  it("contains exactly the deterministic third 15 P0 groups", () => {
    expect(P0_IDENTITY_DECISIONS_BATCH_3.map(item => item.sourceIdentity.sourceGroupId)).toEqual(expected.map(item => item[0]));
    expect(new Set(P0_IDENTITY_DECISIONS_BATCH_3.map(item => item.sourceIdentity.sourceGroupId)).size).toBe(15);
  });

  it.each(expected)("stores the confirmed exact decision for %s (%s / %s)", (groupId, manufacturer, productName, canonicalProductId, canonicalProductName, alias) => {
    const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId(groupId);
    expect(lookup.status).toBe("FOUND");
    if (lookup.status !== "FOUND") return;
    expect(lookup.decision.sourceIdentity).toMatchObject({ manufacturer, productLine: null, productName, sourcePriority: "P0", productLineInterpretation: "CONFIRMED_NONE" });
    expect(lookup.decision.decision).toMatchObject({ status: "RESOLVED", canonicalProductId, canonicalProductName, productLineId: null });
    expect(lookup.decision.review.state).toBe("CONFIRMED");
    expect(lookup.decision.evidence.length).toBeGreaterThanOrEqual(2);
    expect(lookup.decision.evidence.every(item => item.confidence === "MEDIUM" || item.confidence === "HIGH")).toBe(true);
    if (alias) expect(lookup.decision.decision.aliases).toContain(alias);
    expect(validateTobaccoIdentityDecision(lookup.decision)).toMatchObject({ valid: true, applicable: true });
  });

  it("applies all 15 confirmed outcomes", () => {
    const result = applyTobaccoIdentityDecisions(P0_IDENTITY_DECISIONS_BATCH_3.map(record), TOBACCO_IDENTITY_DECISION_REGISTRY);
    expect(result).toMatchObject({ appliedDecisionCount: 15, skippedDecisionCount: 0, conflictCount: 0, invalidDecisionCount: 0 });
    expect(result.records.every(item => item.identityStatus === "RESOLVED" && item.confirmedDecision)).toBe(true);
  });

  it("uses exact source identity lookup and no fuzzy fallback", () => {
    for (const decision of P0_IDENTITY_DECISIONS_BATCH_3) {
      expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(decision.sourceIdentity.manufacturer, null, decision.sourceIdentity.productName)).toMatchObject({ status: "FOUND" });
      expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(decision.sourceIdentity.manufacturer, null, `${decision.sourceIdentity.productName} extra`)).toEqual({ status: "NOT_FOUND" });
    }
  });

  it("does not invent product lines", () => {
    expect(P0_IDENTITY_DECISIONS_BATCH_3.every(item => item.sourceIdentity.productLineInterpretation === "CONFIRMED_NONE")).toBe(true);
    expect(P0_IDENTITY_DECISIONS_BATCH_3.every(item => item.decision.productLineId === null && item.decision.canonicalProductLineName === null)).toBe(true);
  });

  it("prioritizes verified English display names and keeps source variants as aliases", () => {
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0078")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductName: "Passion Fruit", aliases: ["Маракуйя"] } } });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0110")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductName: "Dolce de Lechee", aliases: ["Dolche de Lechee"] } } });
  });

  it("uses centralized transliteration only when no verified English name exists", () => {
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0104")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductId: "jam-granatovyi-sok" } } });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0059")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductId: "overdose-strawberry" } } });
  });

  it("creates only ASCII canonical IDs without collisions", () => {
    const ids = P0_IDENTITY_DECISIONS_BATCH_3.map(item => item.decision.canonicalProductId!);
    expect(ids.every(id => ASCII_CANONICAL_PRODUCT_ID_PATTERN.test(id) && !/[^\x00-\x7F]/.test(id))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not introduce aggregate duplicate, conflict, collision or invalid errors", () => {
    expect(auditTobaccoIdentityDecisions(TOBACCO_IDENTITY_DECISIONS).filter(item => item.severity === "ERROR")).toEqual([]);
    expect(new Set(TOBACCO_IDENTITY_DECISIONS.map(item => item.id)).size).toBe(TOBACCO_IDENTITY_DECISIONS.length);
  });

  it("preserves P1, both earlier P0 batches and legacy mappings", () => {
    const p1End = P1_IDENTITY_DECISIONS_BATCH_1.length;
    const p0Batch1End = p1End + P0_IDENTITY_DECISIONS_BATCH_1.length;
    const p0Batch2End = p0Batch1End + P0_IDENTITY_DECISIONS_BATCH_2.length;
    expect(TOBACCO_IDENTITY_DECISIONS.slice(0, p1End)).toEqual(P1_IDENTITY_DECISIONS_BATCH_1);
    expect(TOBACCO_IDENTITY_DECISIONS.slice(p1End, p0Batch1End)).toEqual(P0_IDENTITY_DECISIONS_BATCH_1);
    expect(TOBACCO_IDENTITY_DECISIONS.slice(p0Batch1End, p0Batch2End)).toEqual(P0_IDENTITY_DECISIONS_BATCH_2);
    expect(P0_IDENTITY_DECISIONS_BATCH_2.filter(item => item.decision.status === "AMBIGUOUS")).toHaveLength(3);
    expect(LEGACY_CANONICAL_PRODUCT_ID_ALIASES).toHaveLength(18);
  });

  it("maps batch 3 to privacy-safe public output", () => {
    const output = P0_IDENTITY_DECISIONS_BATCH_3.map(mapTobaccoIdentityDecisionToPublic);
    const serialized = JSON.stringify(output);
    expect(auditPublicTobaccoIdentityDecisions(output, ["sourceUrl", "sourceReference", "reviewerNotes", "reviewedByType", "sourceRows", "workbook"])).toEqual([]);
    expect(serialized).not.toMatch(/sourceUrl|sourceReference|reviewerNotes|sourceRows/);
  });

  it("is deterministic, immutable and contains no P2/P3 decisions", () => {
    expect(P0_IDENTITY_DECISIONS_BATCH_3.every(item => item.sourceIdentity.sourcePriority === "P0")).toBe(true);
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.list()).toEqual(TOBACCO_IDENTITY_DECISION_REGISTRY.list());
    expect(Object.isFrozen(TOBACCO_IDENTITY_DECISION_REGISTRY)).toBe(true);
    expect(Object.isFrozen(TOBACCO_IDENTITY_DECISION_REGISTRY.list()[0])).toBe(true);
  });
});
