import { describe, expect, it } from "vitest";
import {
  applyTobaccoIdentityDecisions,
  auditPublicTobaccoIdentityDecisions,
  auditTobaccoIdentityDecisions,
  LEGACY_CANONICAL_PRODUCT_ID_ALIASES,
  mapTobaccoIdentityDecisionToPublic,
  P0_IDENTITY_DECISIONS_BATCH_1,
  P0_IDENTITY_DECISIONS_BATCH_2,
  P0_IDENTITY_DECISIONS_BATCH_3,
  P0_IDENTITY_DECISIONS_BATCH_4,
  P0_IDENTITY_DECISIONS_BATCH_5,
  P0_IDENTITY_DECISIONS_BATCH_6,
  P1_IDENTITY_DECISIONS_BATCH_1,
  TOBACCO_IDENTITY_DECISIONS,
  TOBACCO_IDENTITY_DECISION_REGISTRY,
  validateTobaccoIdentityDecision,
} from ".";
import type { DecisionApplicableIdentityRecord } from "./types";

const decision = P0_IDENTITY_DECISIONS_BATCH_6[0]!;

const sourceRecord: DecisionApplicableIdentityRecord = {
  recordId: "batch6-source-component",
  scope: "COMPONENT",
  sourcePriority: "P0",
  usedInVerifiedMix: true,
  manufacturer: "Sebero",
  productLine: null,
  productName: "Черника",
  identityStatus: "UNRESOLVED",
  manufacturerId: null,
  productLineId: null,
  canonicalProductId: null,
  canonicalProductName: null,
  confidence: null,
  evidenceTypes: [],
  confirmedDecision: false,
};

describe("P0 identity decision batch 6", () => {
  it("contains identity-group-0023 exactly once", () => {
    expect(P0_IDENTITY_DECISIONS_BATCH_6).toHaveLength(1);
    expect(P0_IDENTITY_DECISIONS_BATCH_6.map(item => item.sourceIdentity.sourceGroupId)).toEqual(["identity-group-0023"]);
    expect(TOBACCO_IDENTITY_DECISIONS.filter(item => item.sourceIdentity.sourceGroupId === "identity-group-0023")).toHaveLength(1);
  });

  it("stores an explicit AMBIGUOUS outcome", () => {
    expect(decision).toMatchObject({
      sourceIdentity: { manufacturer: "Sebero", productLine: null, productName: "Черника", productLineInterpretation: "AMBIGUOUS" },
      decision: { status: "AMBIGUOUS", manufacturerId: "sebero" },
      review: { state: "AMBIGUOUS" },
    });
    expect(validateTobaccoIdentityDecision(decision)).toMatchObject({ valid: true, applicable: false });
  });

  it("contains authoritative, non-empty evidence references", () => {
    expect(decision.evidence).toHaveLength(3);
    expect(decision.evidence.map(item => item.sourceType)).toEqual(expect.arrayContaining(["OFFICIAL_SOCIAL_ANNOUNCEMENT", "VERIFIED_RETAIL_CATALOG", "VERIFIED_REVIEW_DATABASE"]));
    expect(decision.evidence.every(item => item.sourceReference.trim().length > 0 && item.sourceUrl?.startsWith("https://") && item.publicSafe)).toBe(true);
  });

  it("does not create a canonical product or broad aliases", () => {
    expect(decision.decision).toMatchObject({ productLineId: null, canonicalProductId: null, canonicalProductLineName: null, canonicalProductName: null, aliases: [] });
  });

  it("does not guess a product line from Classic, Limited Edition or Black candidates", () => {
    expect(decision.sourceIdentity.productLine).toBeNull();
    expect(decision.sourceIdentity.productLineInterpretation).toBe("AMBIGUOUS");
    expect(decision.decision.productLineId).toBeNull();
  });

  it("resolves only the exact source spelling in the Registry", () => {
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity("Sebero", null, "Черника")).toMatchObject({ status: "FOUND" });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity("Sebero", null, "Bilberry")).toEqual({ status: "NOT_FOUND" });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity("Sebero", null, "Blueberry")).toEqual({ status: "NOT_FOUND" });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity("Sebero", "Sebero Classic", "Черника")).toEqual({ status: "NOT_FOUND" });
  });

  it("does not collide with other Sebero identities", () => {
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity("Sebero", null, "Vanilla")).toMatchObject({ status: "FOUND" });
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getBySourceIdentity("Sebero", null, "Черника")).toMatchObject({ status: "FOUND" });
    expect(auditTobaccoIdentityDecisions(TOBACCO_IDENTITY_DECISIONS).filter(item => item.severity === "ERROR")).toEqual([]);
  });

  it("keeps the real source occurrence unresolved when applying an ambiguous decision", () => {
    const result = applyTobaccoIdentityDecisions([sourceRecord], TOBACCO_IDENTITY_DECISION_REGISTRY);
    expect(result).toMatchObject({ appliedDecisionCount: 0, skippedDecisionCount: 1, conflictCount: 0, invalidDecisionCount: 0 });
    expect(result.records[0]).toMatchObject({ identityStatus: "UNRESOLVED", canonicalProductId: null, confirmedDecision: false });
  });

  it("adds no Unicode or transliteration candidate because no canonical ID exists", () => {
    expect(decision.decision.canonicalProductId).toBeNull();
    expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getByCanonicalProductId("sebero-chernika")).toEqual({ status: "NOT_FOUND" });
  });

  it("does not add a legacy mapping", () => {
    expect(LEGACY_CANONICAL_PRODUCT_ID_ALIASES).toHaveLength(18);
    expect(LEGACY_CANONICAL_PRODUCT_ID_ALIASES.some(item => item.canonicalProductId.includes("sebero"))).toBe(false);
  });

  it("is included after P1 and P0 batches 1-5 without changing them", () => {
    const previous = [P1_IDENTITY_DECISIONS_BATCH_1, P0_IDENTITY_DECISIONS_BATCH_1, P0_IDENTITY_DECISIONS_BATCH_2, P0_IDENTITY_DECISIONS_BATCH_3, P0_IDENTITY_DECISIONS_BATCH_4, P0_IDENTITY_DECISIONS_BATCH_5].flat();
    expect(TOBACCO_IDENTITY_DECISIONS.slice(0, previous.length)).toEqual(previous);
    expect(TOBACCO_IDENTITY_DECISIONS.slice(previous.length)).toEqual(P0_IDENTITY_DECISIONS_BATCH_6);
  });

  it("maps to privacy-safe public output", () => {
    const output = mapTobaccoIdentityDecisionToPublic(decision);
    const serialized = JSON.stringify(output);
    expect(auditPublicTobaccoIdentityDecisions([output], ["sourceUrl", "sourceReference", "reviewerNotes", "reviewedByType", "sourceRows", "batch6-source-component"])).toEqual([]);
    expect(serialized).not.toMatch(/sourceUrl|sourceReference|reviewerNotes|reviewedByType|sourceRows|batch6-source-component/);
  });

  it("is immutable and limited to P0", () => {
    expect(decision.sourceIdentity.sourcePriority).toBe("P0");
    expect(Object.isFrozen(P0_IDENTITY_DECISIONS_BATCH_6)).toBe(true);
    expect(Object.isFrozen(TOBACCO_IDENTITY_DECISION_REGISTRY)).toBe(true);
  });
});
