import { describe, expect, it } from "vitest";
import {
  applyTobaccoIdentityDecisions,
  auditPublicTobaccoIdentityDecisions,
  auditTobaccoIdentityDecisions,
  compareTobaccoIdentityCoverage,
  createCanonicalTobaccoProductId,
  mapTobaccoIdentityDecisionToPublic,
  P0_IDENTITY_DECISIONS_BATCH_1,
  P1_IDENTITY_DECISIONS_BATCH_1,
  TOBACCO_IDENTITY_DECISIONS,
  TOBACCO_IDENTITY_DECISION_REGISTRY,
  validateTobaccoIdentityDecision,
} from ".";
import type { DecisionApplicableIdentityRecord, TobaccoIdentityDecision } from "./types";

const expected = [
  ["identity-group-0041", "Sapphire Crown", "Dried Plum", "sapphire-crown-dried-plum", null, "Dried Plum", null],
  ["identity-group-0046", "Sapphire", "Go Bananas", "sapphire-crown-go-bananas", null, "Go Bananas!", "Go Bananas"],
  ["identity-group-0062", "Banger", "Абрикосовый джем", "banger-apricot-jam", null, "Apricot Jam", "Абрикосовый джем"],
  ["identity-group-0069", "Brusko", "Цитрусовый чай", "brusko-medium-цитрусовый-чай", "brusko-medium", "Цитрусовый чай", null],
  ["identity-group-0072", "Chabacco", "Апельсин-сливки", "chabacco-mix-апельсин-сливки", "chabacco-mix", "Апельсин-сливки", null],
  ["identity-group-0060", "Chabacco", "Банановый милкшейк", "chabacco-mix-банановый-милкшейк", "chabacco-mix", "Банановый милкшейк", null],
  ["identity-group-0073", "Chabacco", "Бельгийский сидр", "chabacco-medium-belgian-cider", "chabacco-medium", "Belgian Cider", "Бельгийский сидр"],
  ["identity-group-0103", "Chabacco", "Гренадин Drops", "chabacco-mix-гренадин-дропс", "chabacco-mix", "Гренадин Дропс", "Гренадин Drops"],
  ["identity-group-0049", "Chabacco", "Морозная мята", "chabacco-морозная-мята", null, "Морозная мята", null],
  ["identity-group-0108", "Chabacco", "Фруктовый лед", "chabacco-mix-фруктовый-лед", "chabacco-mix", "Фруктовый лед", "Fruit Ice"],
  ["identity-group-0018", "Daily Hookah", "Сливочный крем", "daily-hookah-сливочный-крем", null, "Сливочный крем", null],
  ["identity-group-0020", "Deus", "Skittles", "deus-skittles", null, "Skittles", null],
  ["identity-group-0086", "Dozaj", "Mint", "dozaj-mint", null, "Mint", null],
  ["identity-group-0107", "Duft", "Cherry Juice", "duft-solo-cherry-juice", "duft-solo", "Cherry Juice", "Вишневый сок"],
  ["identity-group-0075", "Duft", "Orange Zest", "duft-solo-orange-zest", "duft-solo", "Orange Zest", "Апельсин"],
] as const;

const record = (decision: TobaccoIdentityDecision): DecisionApplicableIdentityRecord => ({
  recordId: `record-${decision.id}`,
  scope: "COMPONENT",
  sourcePriority: decision.sourceIdentity.sourcePriority,
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

describe("P0 identity decisions batch 1", () => {
  it("contains exactly the deterministic first 15 P0 groups", () => {
    expect(P0_IDENTITY_DECISIONS_BATCH_1.map(item => item.sourceIdentity.sourceGroupId)).toEqual(expected.map(item => item[0]));
    expect(new Set(P0_IDENTITY_DECISIONS_BATCH_1.map(item => item.sourceIdentity.sourceGroupId)).size).toBe(15);
  });

  it.each(expected)("resolves %s (%s / %s) with the evidence-backed identity", (groupId, manufacturer, sourceProductName, canonicalProductId, productLineId, canonicalProductName, alias) => {
    const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId(groupId);
    expect(lookup.status).toBe("FOUND");
    if (lookup.status !== "FOUND") return;
    expect(lookup.decision.sourceIdentity).toMatchObject({
      manufacturer,
      productLine: null,
      productName: sourceProductName,
      sourcePriority: "P0",
      productLineInterpretation: productLineId ? "CONFIRMED" : "CONFIRMED_NONE",
    });
    expect(lookup.decision.decision).toMatchObject({ status: "RESOLVED", canonicalProductId, productLineId, canonicalProductName });
    if (alias) expect(lookup.decision.decision.aliases).toContain(alias);
    expect(validateTobaccoIdentityDecision(lookup.decision)).toMatchObject({ valid: true, applicable: true });
  });

  it.each(expected)("applies %s only to the exact source identity", (groupId, manufacturer, sourceProductName, canonicalProductId) => {
    const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId(groupId);
    if (lookup.status !== "FOUND") throw new Error(`Missing decision ${groupId}.`);
    const exact = applyTobaccoIdentityDecisions([record(lookup.decision)], TOBACCO_IDENTITY_DECISION_REGISTRY);
    const nearMiss = applyTobaccoIdentityDecisions([{ ...record(lookup.decision), recordId: `near-${groupId}`, manufacturer, productName: `${sourceProductName} extra` }], TOBACCO_IDENTITY_DECISION_REGISTRY);
    expect(exact.records[0]).toMatchObject({ identityStatus: "RESOLVED", canonicalProductId, confirmedDecision: true });
    expect(nearMiss.appliedDecisionCount).toBe(0);
  });

  it("uses only confirmed evidence-backed product lines and explicit no-line decisions", () => {
    expect(P0_IDENTITY_DECISIONS_BATCH_1.filter(item => item.decision.productLineId !== null).map(item => item.decision.productLineId).sort()).toEqual([
      "brusko-medium", "chabacco-medium", "chabacco-mix", "chabacco-mix", "chabacco-mix", "chabacco-mix", "duft-solo", "duft-solo",
    ]);
    expect(P0_IDENTITY_DECISIONS_BATCH_1.every(item => item.evidence.length > 0 && item.review.state === "CONFIRMED")).toBe(true);
  });

  it("creates every canonical ID from the reviewed fields", () => {
    for (const item of P0_IDENTITY_DECISIONS_BATCH_1) {
      expect(item.decision.canonicalProductId).toBe(createCanonicalTobaccoProductId(item.decision.manufacturerId!, item.decision.productLineId, item.decision.canonicalProductName!));
    }
  });

  it("keeps all previous P1 decisions unchanged in the aggregate registry", () => {
    expect(TOBACCO_IDENTITY_DECISIONS.slice(0, P1_IDENTITY_DECISIONS_BATCH_1.length)).toEqual(P1_IDENTITY_DECISIONS_BATCH_1);
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0022")).toMatchObject({
      status: "FOUND", decision: { decision: { status: "MANUFACTURER_ONLY", canonicalProductId: null }, review: { state: "NEEDS_MORE_EVIDENCE" } },
    });
  });

  it("has no invalid decision, duplicate, conflict or collision", () => {
    expect(auditTobaccoIdentityDecisions(TOBACCO_IDENTITY_DECISIONS).filter(item => item.severity === "ERROR")).toEqual([]);
  });

  it("applies all 15 synthetic P0 identities and changes only unresolved coverage", () => {
    const before = P0_IDENTITY_DECISIONS_BATCH_1.map(record);
    const applied = applyTobaccoIdentityDecisions(before, TOBACCO_IDENTITY_DECISION_REGISTRY);
    expect(compareTobaccoIdentityCoverage(before, applied)).toMatchObject({
      resolvedDelta: 15, manufacturerOnlyDelta: 0, unresolvedDelta: -15,
      appliedDecisionCount: 15, skippedDecisionCount: 0, invalidDecisionCount: 0, conflictCount: 0,
    });
  });

  it("is immutable and deterministic", () => {
    expect(Object.isFrozen(TOBACCO_IDENTITY_DECISION_REGISTRY)).toBe(true);
    expect(Object.isFrozen(TOBACCO_IDENTITY_DECISION_REGISTRY.list()[0])).toBe(true);
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.list()).toEqual(TOBACCO_IDENTITY_DECISION_REGISTRY.list());
  });

  it("maps the batch to public-safe output", () => {
    const output = P0_IDENTITY_DECISIONS_BATCH_1.map(mapTobaccoIdentityDecisionToPublic);
    const serialized = JSON.stringify(output);
    expect(auditPublicTobaccoIdentityDecisions(output, ["sourceUrl", "sourceReference", "reviewerNotes", "reviewedByType", "sourceRows", "workbook"])).toEqual([]);
    expect(serialized).not.toContain("sourceUrl");
    expect(serialized).not.toContain("sourceReference");
  });
});
