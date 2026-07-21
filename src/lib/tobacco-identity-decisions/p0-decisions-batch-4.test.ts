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
  P0_IDENTITY_DECISIONS_BATCH_4,
  P1_IDENTITY_DECISIONS_BATCH_1,
  TOBACCO_IDENTITY_DECISIONS,
  TOBACCO_IDENTITY_DECISION_REGISTRY,
  validateTobaccoIdentityDecision,
} from ".";
import type { DecisionApplicableIdentityRecord, TobaccoIdentityDecision } from "./types";

const expected = [
  ["identity-group-0064", "Sapphire", "Blueberry Granola", "RESOLVED", "sapphire-crown-blueberry-granola", null, "CONFIRMED_NONE"],
  ["identity-group-0053", "Sapphire", "Fragrant Black Currant", "RESOLVED", "sapphire-crown-fragrant-blackcurrant", null, "CONFIRMED_NONE"],
  ["identity-group-0087", "Sapphire", "Lemon Lime", "RESOLVED", "sapphire-crown-lemon-lime", null, "CONFIRMED_NONE"],
  ["identity-group-0061", "Sapphire", "MeJuMi", "RESOLVED", "sapphire-crown-mejumi", null, "CONFIRMED_NONE"],
  ["identity-group-0014", "Sapphire", "Ананасовая фанта", "RESOLVED", "sapphire-crown-pineapple-fanta", null, "CONFIRMED_NONE"],
  ["identity-group-0050", "Sapphire", "Киви", "RESOLVED", "sapphire-crown-kiwi-fruit", null, "CONFIRMED_NONE"],
  ["identity-group-0063", "Sapphire", "Яблочный штрудель", "RESOLVED", "sapphire-crown-apple-strudel", null, "CONFIRMED_NONE"],
  ["identity-group-0045", "Sarma", "Банановое суфле", "RESOLVED", "sarma-classic-bananovoe-sufle", "sarma-classic", "CONFIRMED"],
  ["identity-group-0051", "Sarma", "Огуречный лимонад", "RESOLVED", "sarma-360-ogurechnyi-limonad", "sarma-360", "CONFIRMED"],
  ["identity-group-0101", "Smoke Angels", "Firestarter", "RESOLVED", "smoke-angels-firestarter", null, "CONFIRMED_NONE"],
  ["identity-group-0039", "Spectrum", "Ice Fruit Gum", "AMBIGUOUS", null, null, "AMBIGUOUS"],
  ["identity-group-0040", "Spectrum", "Jungle Mix", "AMBIGUOUS", null, null, "AMBIGUOUS"],
  ["identity-group-0082", "Take", "Ананас", "RESOLVED", "take-pineapple", null, "CONFIRMED_NONE"],
  ["identity-group-0024", "Urban Soul", "Berry Marmalade", "RESOLVED", "urban-soul-berry-marmalade", null, "CONFIRMED_NONE"],
  ["identity-group-0015", "Urban Soul", "Ананас", "RESOLVED", "urban-soul-pineapple", null, "CONFIRMED_NONE"],
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

describe("P0 identity decisions batch 4", () => {
  it("contains exactly the deterministic fourth 15 P0 groups", () => {
    expect(P0_IDENTITY_DECISIONS_BATCH_4.map(item => item.sourceIdentity.sourceGroupId)).toEqual(expected.map(item => item[0]));
    expect(new Set(P0_IDENTITY_DECISIONS_BATCH_4.map(item => item.sourceIdentity.sourceGroupId)).size).toBe(15);
  });

  it.each(expected)("stores the safe exact decision for %s (%s / %s)", (groupId, manufacturer, productName, status, canonicalProductId, productLineId, interpretation) => {
    const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId(groupId);
    expect(lookup.status).toBe("FOUND");
    if (lookup.status !== "FOUND") return;
    expect(lookup.decision.sourceIdentity).toMatchObject({ manufacturer, productLine: null, productName, sourcePriority: "P0", productLineInterpretation: interpretation });
    expect(lookup.decision.decision).toMatchObject({ status, canonicalProductId, productLineId });
    expect(lookup.decision.review.state).toBe(status === "RESOLVED" ? "CONFIRMED" : "AMBIGUOUS");
    const singleSourceAllowed = groupId === "identity-group-0101" || groupId === "identity-group-0015";
    expect(lookup.decision.evidence.length).toBeGreaterThanOrEqual(status === "RESOLVED" && singleSourceAllowed ? 1 : 2);
    expect(lookup.decision.evidence.every(item => item.confidence === "MEDIUM" || item.confidence === "HIGH")).toBe(true);
    expect(validateTobaccoIdentityDecision(lookup.decision)).toMatchObject({ valid: true, applicable: status === "RESOLVED" });
  });

  it("applies 13 confirmed outcomes and safely skips both ambiguous identities", () => {
    const result = applyTobaccoIdentityDecisions(P0_IDENTITY_DECISIONS_BATCH_4.map(record), TOBACCO_IDENTITY_DECISION_REGISTRY);
    expect(result).toMatchObject({ appliedDecisionCount: 13, skippedDecisionCount: 2, conflictCount: 0, invalidDecisionCount: 0 });
    expect(result.records.filter(item => item.identityStatus === "RESOLVED" && item.confirmedDecision)).toHaveLength(13);
    expect(result.records.filter(item => item.identityStatus === "UNRESOLVED" && !item.confirmedDecision)).toHaveLength(2);
  });

  it("uses exact source identity lookup and no fuzzy fallback", () => {
    for (const item of P0_IDENTITY_DECISIONS_BATCH_4) {
      expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(item.sourceIdentity.manufacturer, null, item.sourceIdentity.productName)).toMatchObject({ status: "FOUND" });
      expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity(item.sourceIdentity.manufacturer, null, `${item.sourceIdentity.productName} extra`)).toEqual({ status: "NOT_FOUND" });
    }
  });

  it("keeps Spectrum products ambiguous because the source line is absent", () => {
    const ambiguous = P0_IDENTITY_DECISIONS_BATCH_4.filter(item => item.decision.status === "AMBIGUOUS");
    expect(ambiguous.map(item => item.sourceIdentity.sourceGroupId)).toEqual(["identity-group-0039", "identity-group-0040"]);
    expect(ambiguous.every(item => item.sourceIdentity.productLineInterpretation === "AMBIGUOUS")).toBe(true);
    expect(ambiguous.every(item => item.decision.canonicalProductId === null && item.decision.productLineId === null)).toBe(true);
  });

  it("stores only evidence-backed product line interpretations", () => {
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0045")).toMatchObject({ status: "FOUND", decision: { sourceIdentity: { productLineInterpretation: "CONFIRMED" }, decision: { productLineId: "sarma-classic", canonicalProductLineName: "Классическая" } } });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0051")).toMatchObject({ status: "FOUND", decision: { sourceIdentity: { productLineInterpretation: "CONFIRMED" }, decision: { productLineId: "sarma-360", canonicalProductLineName: "360" } } });
    expect(P0_IDENTITY_DECISIONS_BATCH_4.filter(item => item.decision.status === "RESOLVED" && !item.decision.productLineId).every(item => item.sourceIdentity.productLineInterpretation === "CONFIRMED_NONE")).toBe(true);
  });

  it("prioritizes verified English names and retains confirmed source aliases", () => {
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0053")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductName: "Fragrant Blackcurrant", aliases: ["Fragrant Black Currant"] } } });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0014")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductName: "Pineapple Fanta", aliases: ["Ананасовая фанта", "Pineapple Funta"] } } });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0050")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductName: "Kiwi Fruit", aliases: ["Киви"] } } });
  });

  it("uses centralized transliteration when no verified English name exists", () => {
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0045")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductId: "sarma-classic-bananovoe-sufle" } } });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceGroupId("identity-group-0051")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductId: "sarma-360-ogurechnyi-limonad" } } });
  });

  it("creates only unique ASCII canonical IDs without collisions", () => {
    const ids = P0_IDENTITY_DECISIONS_BATCH_4.flatMap(item => item.decision.canonicalProductId ? [item.decision.canonicalProductId] : []);
    expect(ids).toHaveLength(13);
    expect(ids.every(id => ASCII_CANONICAL_PRODUCT_ID_PATTERN.test(id) && !/[^\x00-\x7F]/.test(id))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not introduce aggregate duplicate, conflict, collision or invalid errors", () => {
    expect(auditTobaccoIdentityDecisions(TOBACCO_IDENTITY_DECISIONS).filter(item => item.severity === "ERROR")).toEqual([]);
    expect(new Set(TOBACCO_IDENTITY_DECISIONS.map(item => item.id)).size).toBe(TOBACCO_IDENTITY_DECISIONS.length);
  });

  it("preserves P1 and all three earlier P0 batches", () => {
    const p1End = P1_IDENTITY_DECISIONS_BATCH_1.length;
    const batch1End = p1End + P0_IDENTITY_DECISIONS_BATCH_1.length;
    const batch2End = batch1End + P0_IDENTITY_DECISIONS_BATCH_2.length;
    const batch3End = batch2End + P0_IDENTITY_DECISIONS_BATCH_3.length;
    expect(TOBACCO_IDENTITY_DECISIONS.slice(0, p1End)).toEqual(P1_IDENTITY_DECISIONS_BATCH_1);
    expect(TOBACCO_IDENTITY_DECISIONS.slice(p1End, batch1End)).toEqual(P0_IDENTITY_DECISIONS_BATCH_1);
    expect(TOBACCO_IDENTITY_DECISIONS.slice(batch1End, batch2End)).toEqual(P0_IDENTITY_DECISIONS_BATCH_2);
    expect(TOBACCO_IDENTITY_DECISIONS.slice(batch2End, batch3End)).toEqual(P0_IDENTITY_DECISIONS_BATCH_3);
    expect(P0_IDENTITY_DECISIONS_BATCH_2.filter(item => item.decision.status === "AMBIGUOUS")).toHaveLength(3);
    expect(LEGACY_CANONICAL_PRODUCT_ID_ALIASES).toHaveLength(18);
  });

  it("maps batch 4 to privacy-safe public output", () => {
    const output = P0_IDENTITY_DECISIONS_BATCH_4.map(mapTobaccoIdentityDecisionToPublic);
    const serialized = JSON.stringify(output);
    expect(auditPublicTobaccoIdentityDecisions(output, ["sourceUrl", "sourceReference", "reviewerNotes", "reviewedByType", "sourceRows", "workbook"])).toEqual([]);
    expect(serialized).not.toMatch(/sourceUrl|sourceReference|reviewerNotes|sourceRows|workbook/);
  });

  it("is deterministic, immutable and contains no P2/P3 decisions", () => {
    expect(P0_IDENTITY_DECISIONS_BATCH_4.every(item => item.sourceIdentity.sourcePriority === "P0")).toBe(true);
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.list()).toEqual(TOBACCO_IDENTITY_DECISION_REGISTRY.list());
    expect(Object.isFrozen(TOBACCO_IDENTITY_DECISION_REGISTRY)).toBe(true);
    expect(Object.isFrozen(TOBACCO_IDENTITY_DECISION_REGISTRY.list()[0])).toBe(true);
  });
});
