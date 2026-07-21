import { describe, expect, it } from "vitest";
import {
  applyTobaccoIdentityDecisions,
  ASCII_CANONICAL_PRODUCT_ID_PATTERN,
  auditPublicTobaccoIdentityDecisions,
  auditTobaccoIdentityDecisions,
  LEGACY_CANONICAL_PRODUCT_ID_ALIASES,
  LEGACY_CANONICAL_PRODUCT_ID_ALIAS_REGISTRY,
  mapTobaccoIdentityDecisionToPublic,
  P0_IDENTITY_DECISIONS_BATCH_1,
  P0_IDENTITY_DECISIONS_BATCH_2,
  P0_IDENTITY_DECISIONS_BATCH_3,
  P0_IDENTITY_DECISIONS_BATCH_4,
  P0_IDENTITY_DECISIONS_BATCH_5,
  P1_IDENTITY_DECISIONS_BATCH_1,
  TOBACCO_IDENTITY_DECISIONS,
  TOBACCO_IDENTITY_DECISION_REGISTRY,
  validateTobaccoIdentityDecision,
} from ".";
import type { DecisionApplicableIdentityRecord, TobaccoIdentityDecision } from "./types";

const expected = [
  ["identity-group-0066", "Urban Soul", null, "Клубника", "RESOLVED", "urban-soul-strawberry", null, "CONFIRMED_NONE"],
  ["identity-group-0037", "не указан", null, "Освежающий мохито", "UNRESOLVED", null, null, "UNKNOWN"],
  ["identity-group-0105", "Северный", null, "Крепкий орешек", "RESOLVED", "severnyi-krepkii-oreshek", null, "CONFIRMED_NONE"],
  ["identity-group-0085", "Северный", null, "Секвойя", "RESOLVED", "severnyi-sekvoiya", null, "CONFIRMED_NONE"],
  ["identity-group-0081", "Deus Perfume", null, "Black Afgano", "RESOLVED", "deus-perfume-black-afgano", "deus-perfume", "CONFIRMED"],
  ["identity-group-0019", "Element Earth", null, "Wildberry Mors", "RESOLVED", "element-earth-wildberry-mors", "element-earth", "CONFIRMED"],
  ["identity-group-0065", "Sapphire Crown", null, "Kiwi Fruit", "UNRESOLVED", null, null, "CONFIRMED_NONE"],
  ["identity-group-0017", "Sapphire Crown", null, "Pumpkin RAF", "RESOLVED", "sapphire-crown-pumpkin-raf", null, "CONFIRMED_NONE"],
  ["identity-group-0027", "Sapphire Crown", null, "Sunny Peach", "RESOLVED", "sapphire-crown-sunny-peach", null, "CONFIRMED_NONE"],
  ["identity-group-0068", "Sapphire Crown", null, "Yuzu-Honey", "RESOLVED", "sapphire-crown-yuzu-honey", null, "CONFIRMED_NONE"],
  ["identity-group-0033", "Sarma 360", "крепкая", "Горная лаванда", "RESOLVED", "sarma-360-gornaya-lavanda", "sarma-360", "CONFIRMED"],
  ["identity-group-0032", "Sarma 360", "крепкая", "Джин", "RESOLVED", "sarma-360-dzhin", "sarma-360", "CONFIRMED"],
  ["identity-group-0012", "Sarma 360", "крепкая", "Персик", "RESOLVED", "sarma-360-persik", "sarma-360", "CONFIRMED"],
  ["identity-group-0011", "Sarma 360", "лёгкая", "Шампанское", "RESOLVED", "sarma-360-light-shampanskoe", "sarma-360-light", "CONFIRMED"],
  ["identity-group-0106", "Sebero", null, "Vanilla", "AMBIGUOUS", null, null, "AMBIGUOUS"],
] as const;

const records = (decision: TobaccoIdentityDecision): DecisionApplicableIdentityRecord[] => decision.sourceIdentity.sourceSheets.map((sheet, index) => ({
  recordId: `${sheet}:${decision.id}:${index}`,
  scope: sheet === "Mix_Components" ? "COMPONENT" : "CATALOG",
  sourcePriority: "P0",
  usedInVerifiedMix: sheet === "Mix_Components",
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
}));

describe("P0 identity decisions batch 5", () => {
  it("contains exactly the deterministic fifth 15 P0 groups", () => {
    expect(P0_IDENTITY_DECISIONS_BATCH_5.map(item => item.sourceIdentity.sourceGroupId)).toEqual(expected.map(item => item[0]));
    expect(new Set(P0_IDENTITY_DECISIONS_BATCH_5.map(item => item.sourceIdentity.sourceGroupId)).size).toBe(15);
  });

  it.each(expected)("stores the safe exact decision for %s (%s / %s / %s)", (groupId, manufacturer, productLine, productName, status, canonicalProductId, productLineId, interpretation) => {
    const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId(groupId);
    expect(lookup.status).toBe("FOUND");
    if (lookup.status !== "FOUND") return;
    expect(lookup.decision.sourceIdentity).toMatchObject({ manufacturer, productLine, productName, sourcePriority: "P0", productLineInterpretation: interpretation });
    expect(lookup.decision.decision).toMatchObject({ status, canonicalProductId, productLineId });
    expect(lookup.decision.review.state).toBe(status === "RESOLVED" ? "CONFIRMED" : status === "AMBIGUOUS" ? "AMBIGUOUS" : "DEFERRED");
    expect(lookup.decision.evidence.length).toBeGreaterThanOrEqual(2);
    expect(lookup.decision.evidence.every(item => ["LOW", "MEDIUM", "HIGH"].includes(item.confidence))).toBe(true);
    expect(validateTobaccoIdentityDecision(lookup.decision)).toMatchObject({ valid: true, applicable: status === "RESOLVED" });
  });

  it("applies 12 confirmed outcomes and safely skips four non-applicable occurrences", () => {
    const input = P0_IDENTITY_DECISIONS_BATCH_5.flatMap(records);
    const result = applyTobaccoIdentityDecisions(input, TOBACCO_IDENTITY_DECISION_REGISTRY);
    expect(input).toHaveLength(19);
    expect(result).toMatchObject({ appliedDecisionCount: 15, skippedDecisionCount: 4, conflictCount: 0, invalidDecisionCount: 0 });
    expect(result.records.filter(item => item.identityStatus === "RESOLVED" && item.confirmedDecision)).toHaveLength(15);
    expect(result.records.filter(item => item.identityStatus === "UNRESOLVED" && !item.confirmedDecision)).toHaveLength(4);
    expect(result.records.filter(item => item.scope === "COMPONENT" && item.confirmedDecision)).toHaveLength(12);
    expect(result.records.filter(item => item.scope === "CATALOG" && item.confirmedDecision)).toHaveLength(3);
  });

  it("uses exact source identity lookup and no fuzzy fallback", () => {
    for (const item of P0_IDENTITY_DECISIONS_BATCH_5) {
      expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(item.sourceIdentity.manufacturer, item.sourceIdentity.productLine, item.sourceIdentity.productName)).toMatchObject({ status: "FOUND" });
      expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(item.sourceIdentity.manufacturer, item.sourceIdentity.productLine, `${item.sourceIdentity.productName} extra`)).toEqual({ status: "NOT_FOUND" });
    }
  });

  it("stores the expected outcome counts", () => {
    expect(P0_IDENTITY_DECISIONS_BATCH_5.filter(item => item.decision.status === "RESOLVED")).toHaveLength(12);
    expect(P0_IDENTITY_DECISIONS_BATCH_5.filter(item => item.decision.status === "AMBIGUOUS")).toHaveLength(1);
    expect(P0_IDENTITY_DECISIONS_BATCH_5.filter(item => item.decision.status === "UNRESOLVED")).toHaveLength(2);
    expect(P0_IDENTITY_DECISIONS_BATCH_5.filter(item => item.decision.status === "MANUFACTURER_ONLY" || item.decision.status === "REJECTED")).toHaveLength(0);
  });

  it("keeps the selected line-less Sebero Vanilla identity ambiguous", () => {
    const ambiguous = P0_IDENTITY_DECISIONS_BATCH_5.filter(item => item.decision.status === "AMBIGUOUS");
    expect(ambiguous.map(item => item.sourceIdentity.sourceGroupId)).toEqual(["identity-group-0106"]);
    expect(ambiguous.every(item => item.sourceIdentity.productLineInterpretation === "AMBIGUOUS" && item.decision.canonicalProductId === null)).toBe(true);
  });

  it("defers the duplicate Kiwi Fruit source without creating a canonical collision", () => {
    const deferred = TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0065");
    expect(deferred).toMatchObject({ status: "FOUND", decision: { decision: { status: "UNRESOLVED", canonicalProductId: null }, review: { state: "DEFERRED" } } });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getByCanonicalProductId("sapphire-crown-kiwi-fruit")).toMatchObject({ status: "FOUND", decision: { sourceIdentity: { sourceGroupId: "identity-group-0050" } } });
  });

  it("defers the generic Mojito label without guessing a manufacturer", () => {
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0037")).toMatchObject({
      status: "FOUND",
      decision: {
        sourceIdentity: { manufacturer: "не указан", productLineInterpretation: "UNKNOWN" },
        decision: { status: "UNRESOLVED", manufacturerId: null, canonicalProductId: null },
        review: { state: "DEFERRED" },
      },
    });
  });

  it("keeps confirmed strong and light Sarma lines separate", () => {
    expect(P0_IDENTITY_DECISIONS_BATCH_5.filter(item => item.sourceIdentity.productLine === "крепкая").every(item => item.decision.productLineId === "sarma-360")).toBe(true);
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0011")).toMatchObject({ status: "FOUND", decision: { decision: { productLineId: "sarma-360-light", canonicalProductLineName: "360 Лёгкая" } } });
  });

  it("manually confirms composite manufacturer values only with exact line evidence", () => {
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0081")).toMatchObject({ status: "FOUND", decision: { sourceIdentity: { manufacturer: "Deus Perfume", productLineInterpretation: "CONFIRMED" }, decision: { manufacturerId: "deus", productLineId: "deus-perfume" } } });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0019")).toMatchObject({ status: "FOUND", decision: { sourceIdentity: { manufacturer: "Element Earth", productLineInterpretation: "CONFIRMED" }, decision: { manufacturerId: "element", productLineId: "element-earth" } } });
  });

  it("uses verified English names before transliteration and retains public aliases", () => {
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0066")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductName: "Strawberry", canonicalProductId: "urban-soul-strawberry", aliases: ["Клубника"] } } });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0019")).toMatchObject({ status: "FOUND", decision: { decision: { aliases: ["Ягодный морс"] } } });
  });

  it("uses centralized transliteration when no verified English product name exists", () => {
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0033")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductId: "sarma-360-gornaya-lavanda" } } });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0085")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductId: "severnyi-sekvoiya" } } });
  });

  it("creates only unique ASCII canonical IDs without collisions", () => {
    const ids = P0_IDENTITY_DECISIONS_BATCH_5.flatMap(item => item.decision.canonicalProductId ? [item.decision.canonicalProductId] : []);
    expect(ids).toHaveLength(12);
    expect(ids.every(id => ASCII_CANONICAL_PRODUCT_ID_PATTERN.test(id) && !/[^\x00-\x7F]/.test(id))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(auditTobaccoIdentityDecisions(TOBACCO_IDENTITY_DECISIONS).filter(item => item.severity === "ERROR")).toEqual([]);
  });

  it("preserves P1, all four earlier P0 batches and all earlier ambiguous decisions", () => {
    const batches = [P1_IDENTITY_DECISIONS_BATCH_1, P0_IDENTITY_DECISIONS_BATCH_1, P0_IDENTITY_DECISIONS_BATCH_2, P0_IDENTITY_DECISIONS_BATCH_3, P0_IDENTITY_DECISIONS_BATCH_4, P0_IDENTITY_DECISIONS_BATCH_5];
    let offset = 0;
    for (const batch of batches) {
      expect(TOBACCO_IDENTITY_DECISIONS.slice(offset, offset + batch.length)).toEqual(batch);
      offset += batch.length;
    }
    expect(P0_IDENTITY_DECISIONS_BATCH_2.filter(item => item.decision.status === "AMBIGUOUS")).toHaveLength(3);
    expect(P0_IDENTITY_DECISIONS_BATCH_4.filter(item => item.decision.status === "AMBIGUOUS")).toHaveLength(2);
  });

  it("preserves the immutable legacy lookup without adding mappings", () => {
    expect(LEGACY_CANONICAL_PRODUCT_ID_ALIASES).toHaveLength(18);
    expect(LEGACY_CANONICAL_PRODUCT_ID_ALIAS_REGISTRY.resolve("sarma-360-горная-лаванда")).toEqual({ status: "NOT_FOUND" });
    expect(LEGACY_CANONICAL_PRODUCT_ID_ALIAS_REGISTRY.resolve("brusko-medium-цитрусовый-чай")).toMatchObject({ status: "FOUND", canonicalProductId: "brusko-medium-tsitrusovyi-chai" });
  });

  it("maps batch 5 to privacy-safe public output", () => {
    const output = P0_IDENTITY_DECISIONS_BATCH_5.map(mapTobaccoIdentityDecisionToPublic);
    const serialized = JSON.stringify(output);
    expect(auditPublicTobaccoIdentityDecisions(output, ["sourceUrl", "sourceReference", "reviewerNotes", "reviewedByType", "sourceRows", "workbook", "internalReference"])).toEqual([]);
    expect(serialized).not.toMatch(/sourceUrl|sourceReference|reviewerNotes|reviewedByType|sourceRows|workbook|internalReference/);
  });

  it("leaves the final batch 6 group untouched", () => {
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0023")).toEqual({ status: "NOT_FOUND" });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity("Sebero", null, "Черника")).toEqual({ status: "NOT_FOUND" });
  });

  it("is deterministic, immutable and contains no P2/P3 decisions", () => {
    expect(P0_IDENTITY_DECISIONS_BATCH_5.every(item => item.sourceIdentity.sourcePriority === "P0")).toBe(true);
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.list()).toEqual(TOBACCO_IDENTITY_DECISION_REGISTRY.list());
    expect(Object.isFrozen(TOBACCO_IDENTITY_DECISION_REGISTRY)).toBe(true);
    expect(Object.isFrozen(TOBACCO_IDENTITY_DECISION_REGISTRY.list()[0])).toBe(true);
  });
});
