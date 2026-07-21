import { describe, expect, it } from "vitest";
import {
  applyTobaccoIdentityDecisions,
  ASCII_CANONICAL_PRODUCT_ID_PATTERN,
  auditPublicTobaccoIdentityDecisions,
  auditTobaccoIdentityDecisions,
  createAsciiCanonicalSlug,
  createCanonicalTobaccoProductId,
  LEGACY_CANONICAL_PRODUCT_ID_ALIASES,
  mapTobaccoIdentityDecisionToPublic,
  P0_IDENTITY_DECISIONS_BATCH_1,
  P0_IDENTITY_DECISIONS_BATCH_2,
  P1_IDENTITY_DECISIONS_BATCH_1,
  TOBACCO_IDENTITY_DECISIONS,
  TOBACCO_IDENTITY_DECISION_REGISTRY,
  validateTobaccoIdentityDecision,
} from ".";
import type { DecisionApplicableIdentityRecord, TobaccoIdentityDecision } from "./types";

const expected = [
  ["identity-group-0109", "Duft", "Papaya", "AMBIGUOUS", null, null, null],
  ["identity-group-0052", "Element", "Feijoa Lemonade", "AMBIGUOUS", null, null, null],
  ["identity-group-0100", "Element", "Milky Mouse", "RESOLVED", "element-air-milky-mouse", "element-air", null],
  ["identity-group-0002", "Element", "Персик", "AMBIGUOUS", null, null, null],
  ["identity-group-0097", "Endorphin", "Apple", "RESOLVED", "endorphin-apple", null, null],
  ["identity-group-0096", "Endorphin", "Napoleon", "RESOLVED", "endorphin-napoleon", null, null],
  ["identity-group-0095", "Fake", "Holod", "RESOLVED", "fake-holod", null, "Холодок"],
  ["identity-group-0094", "Fake", "Mumbai Tea", "RESOLVED", "fake-mumbai-tea", null, "Чай Масала"],
  ["identity-group-0044", "Hook", "Гранатовый", "RESOLVED", "hook-granatovyi", null, null],
  ["identity-group-0074", "Hook", "Инжирный", "RESOLVED", "hook-inzhirnyi", null, null],
  ["identity-group-0031", "Hook", "Лимон-лайм", "RESOLVED", "hook-limon-laim", null, "Лимон-лайм"],
  ["identity-group-0084", "Husky", "Caipirinha", "RESOLVED", "husky-caipirinha", null, null],
  ["identity-group-0038", "Husky", "Kiwano", "RESOLVED", "husky-kiwano", null, null],
  ["identity-group-0083", "Husky", "Marzipan", "RESOLVED", "husky-marzipan", null, null],
  ["identity-group-0077", "Husky", "Ананас", "RESOLVED", "husky-pineapple", null, "Ананас"],
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

describe("P0 identity decisions batch 2", () => {
  it("contains exactly the deterministic second 15 P0 groups", () => {
    expect(P0_IDENTITY_DECISIONS_BATCH_2.map(item => item.sourceIdentity.sourceGroupId)).toEqual(expected.map(item => item[0]));
    expect(new Set(P0_IDENTITY_DECISIONS_BATCH_2.map(item => item.sourceIdentity.sourceGroupId)).size).toBe(15);
  });

  it.each(expected)("stores the reviewed outcome for %s (%s / %s)", (groupId, manufacturer, productName, status, canonicalProductId, productLineId, alias) => {
    const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId(groupId);
    expect(lookup.status).toBe("FOUND");
    if (lookup.status !== "FOUND") return;
    expect(lookup.decision.sourceIdentity).toMatchObject({ manufacturer, productLine: null, productName, sourcePriority: "P0" });
    expect(lookup.decision.decision).toMatchObject({ status, canonicalProductId, productLineId });
    expect(lookup.decision.sourceIdentity.productLineInterpretation).toBe(status === "AMBIGUOUS" ? "AMBIGUOUS" : productLineId ? "CONFIRMED" : "CONFIRMED_NONE");
    if (alias) expect(lookup.decision.decision.aliases).toContain(alias);
    const validation = validateTobaccoIdentityDecision(lookup.decision);
    expect(validation.valid).toBe(true);
    expect(validation.applicable).toBe(status === "RESOLVED");
  });

  it("applies every RESOLVED outcome and preserves every AMBIGUOUS source record", () => {
    const records = P0_IDENTITY_DECISIONS_BATCH_2.map(record);
    const result = applyTobaccoIdentityDecisions(records, TOBACCO_IDENTITY_DECISION_REGISTRY);
    expect(result.appliedDecisionCount).toBe(12);
    expect(result.skippedDecisionCount).toBe(3);
    expect(result.records.filter(item => item.identityStatus === "RESOLVED")).toHaveLength(12);
    expect(result.records.filter(item => item.identityStatus === "UNRESOLVED")).toHaveLength(3);
  });

  it("uses exact lookup only for all 15 source identities", () => {
    for (const decision of P0_IDENTITY_DECISIONS_BATCH_2) {
      expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(decision.sourceIdentity.manufacturer, null, decision.sourceIdentity.productName)).toMatchObject({ status: "FOUND" });
      expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(decision.sourceIdentity.manufacturer, null, `${decision.sourceIdentity.productName} extra`)).toEqual({ status: "NOT_FOUND" });
    }
  });

  it("keeps ambiguous product lines without a guessed canonical product", () => {
    const ambiguous = P0_IDENTITY_DECISIONS_BATCH_2.filter(item => item.decision.status === "AMBIGUOUS");
    expect(ambiguous.map(item => item.sourceIdentity.sourceGroupId)).toEqual(["identity-group-0109", "identity-group-0052", "identity-group-0002"]);
    expect(ambiguous.every(item => item.decision.canonicalProductId === null && item.decision.productLineId === null && item.review.state === "AMBIGUOUS")).toBe(true);
  });

  it("uses confirmed Air and explicit no-line interpretations only", () => {
    const resolved = P0_IDENTITY_DECISIONS_BATCH_2.filter(item => item.decision.status === "RESOLVED");
    expect(resolved.filter(item => item.decision.productLineId).map(item => item.decision.productLineId)).toEqual(["element-air"]);
    expect(resolved.filter(item => !item.decision.productLineId).every(item => item.sourceIdentity.productLineInterpretation === "CONFIRMED_NONE")).toBe(true);
  });

  it("creates ASCII canonical IDs using English names first and centralized transliteration as fallback", () => {
    const resolved = P0_IDENTITY_DECISIONS_BATCH_2.filter(item => item.decision.status === "RESOLVED");
    expect(resolved.every(item => ASCII_CANONICAL_PRODUCT_ID_PATTERN.test(item.decision.canonicalProductId!))).toBe(true);
    expect(resolved.every(item => !/[^\x00-\x7F]/.test(item.decision.canonicalProductId!))).toBe(true);
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0077")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductId: "husky-pineapple" } } });
    expect(createCanonicalTobaccoProductId("hook", null, "Гранатовый")).toBe("hook-granatovyi");
    expect(createAsciiCanonicalSlug("Гранатовый")).toBe("granatovyi");
  });

  it("does not introduce duplicate, collision, conflict or invalid aggregate decisions", () => {
    expect(auditTobaccoIdentityDecisions(TOBACCO_IDENTITY_DECISIONS).filter(item => item.severity === "ERROR")).toEqual([]);
    expect(new Set(TOBACCO_IDENTITY_DECISIONS.map(item => item.id)).size).toBe(TOBACCO_IDENTITY_DECISIONS.length);
  });

  it("preserves P1, P0 batch 1 and legacy mappings unchanged", () => {
    expect(TOBACCO_IDENTITY_DECISIONS.slice(0, P1_IDENTITY_DECISIONS_BATCH_1.length)).toEqual(P1_IDENTITY_DECISIONS_BATCH_1);
    expect(TOBACCO_IDENTITY_DECISIONS.slice(P1_IDENTITY_DECISIONS_BATCH_1.length, P1_IDENTITY_DECISIONS_BATCH_1.length + P0_IDENTITY_DECISIONS_BATCH_1.length)).toEqual(P0_IDENTITY_DECISIONS_BATCH_1);
    expect(LEGACY_CANONICAL_PRODUCT_ID_ALIASES).toHaveLength(18);
  });

  it("maps all outcomes to public-safe output", () => {
    const output = P0_IDENTITY_DECISIONS_BATCH_2.map(mapTobaccoIdentityDecisionToPublic);
    const serialized = JSON.stringify(output);
    expect(auditPublicTobaccoIdentityDecisions(output, ["sourceUrl", "sourceReference", "reviewerNotes", "reviewedByType", "sourceRows", "workbook"])).toEqual([]);
    expect(serialized).not.toContain("sourceUrl");
    expect(serialized).not.toContain("sourceReference");
  });

  it("is deterministic, immutable and does not enable P2/P3", () => {
    expect(Object.isFrozen(TOBACCO_IDENTITY_DECISION_REGISTRY)).toBe(true);
    expect(Object.isFrozen(TOBACCO_IDENTITY_DECISION_REGISTRY.list()[0])).toBe(true);
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.list()).toEqual(TOBACCO_IDENTITY_DECISION_REGISTRY.list());
    expect(P0_IDENTITY_DECISIONS_BATCH_2.every(item => item.sourceIdentity.sourcePriority === "P0")).toBe(true);
  });
});
