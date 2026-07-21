import { describe, expect, it } from "vitest";
import {
  applyTobaccoIdentityDecisions,
  auditPublicTobaccoIdentityDecisions,
  auditTobaccoIdentityDecisions,
  compareTobaccoIdentityCoverage,
  createCanonicalTobaccoProductId,
  createDecisionFixture,
  mapTobaccoIdentityDecisionToPublic,
  P1_IDENTITY_DECISIONS_BATCH_1,
  P1_IDENTITY_DECISION_REGISTRY_BATCH_1,
  validateTobaccoIdentityDecision,
} from "./index";
import type { DecisionApplicableIdentityRecord, TobaccoIdentityDecision } from "./types";

const expectedResolved = [
  ["identity-group-0001", "MustHave", "Клубничный сорбет", "musthave-sorbetto", null, "Sorbetto", "Клубничный сорбет"],
  ["identity-group-0003", "BlackBurn", "Банановое суфле", "blackburn-на-расслабоне", null, "На расслабоне", "Банановое суфле"],
  ["identity-group-0004", "BlackBurn", "Клюквенный морс", "blackburn-клюквенный-морс", null, "Клюквенный морс", null],
  ["identity-group-0005", "BlackBurn", "На чиле", "blackburn-на-чилле", null, "На чилле", "На чиле"],
  ["identity-group-0006", "MustHave", "Ежевика", "musthave-blackberry", null, "Blackberry", "Ежевика"],
  ["identity-group-0007", "MustHave", "Кислые ягоды", "musthave-sour-berries", null, "Sour Berries", "Кислые ягоды"],
  ["identity-group-0008", "BlackBurn", "Tic Tac", "blackburn-tic-tac", null, "Tic Tac", "Tik Tak"],
  ["identity-group-0009", "BlackBurn", "Ice Baby", "blackburn-ice-baby", null, "Ice Baby", "BLACKBURN feat. GUF - ICE BABY"],
  ["identity-group-0010", "MustHave", "Кислые тропики", "musthave-sour-tropic", null, "Sour Tropic", "Кислые тропики"],
  ["identity-group-0013", "MustHave", "Кислый цитрус", "musthave-sour-citrus", null, "Sour Citrus", "Кислый цитрус"],
  ["identity-group-0016", "НАШ", "Карамель-цитрус", "nash-white-line-карамель-цитрус", "nash-white-line", "Карамель цитрус", "Карамель-цитрус"],
  ["identity-group-0025", "BlackBurn", "Raspberry Shock", "blackburn-shock-raspberry", "blackburn-shock", "Raspberry", "Raspberry Shock"],
  ["identity-group-0028", "BlackBurn", "Green Tea", "blackburn-green-tea", null, "Green Tea", "Зеленый чай"],
  ["identity-group-0034", "BlackBurn", "Миндальная груша", "blackburn-almond-pear", null, "Almond Pear", "Миндальная груша"],
  ["identity-group-0036", "MustHave", "Яблочные леденцы", "musthave-apple-drops", null, "Apple Drops", "Яблочные леденцы"],
  ["identity-group-0067", "MustHave", "Pineapple Rings", "musthave-pineapple-rings", null, "Pineapple Rings", "Ананасовый колечки"],
  ["identity-group-0076", "НАШ", "Арбуз", "nash-black-line-арбуз", "nash-black-line", "Арбуз", null],
  ["identity-group-0098", "MustHave", "Ванильный крем", "musthave-vanilla-cream", null, "Vanilla Cream", "Ванильный крем"],
  ["identity-group-0099", "MustHave", "Кленовый пекан", "musthave-maple-pecan", null, "Maple Pecan", "Кленовый пекан"],
] as const;

const record = (decision: TobaccoIdentityDecision): DecisionApplicableIdentityRecord => ({
  recordId: `record-${decision.id}`,
  scope: "COMPONENT",
  sourcePriority: "P1",
  usedInVerifiedMix: true,
  manufacturer: decision.sourceIdentity.manufacturer,
  productLine: decision.sourceIdentity.productLine,
  productName: decision.sourceIdentity.productName,
  identityStatus: "MANUFACTURER_ONLY",
  manufacturerId: decision.decision.manufacturerId,
  productLineId: null,
  canonicalProductId: null,
  canonicalProductName: decision.sourceIdentity.productName,
  confidence: null,
  evidenceTypes: [],
  confirmedDecision: false,
});

describe("P1 identity decisions batch 1", () => {
  it("contains all 20 P1 review groups exactly once", () => {
    expect(P1_IDENTITY_DECISIONS_BATCH_1).toHaveLength(20);
    expect(new Set(P1_IDENTITY_DECISIONS_BATCH_1.map(item => item.sourceIdentity.sourceGroupId)).size).toBe(20);
    expect(P1_IDENTITY_DECISION_REGISTRY_BATCH_1.size).toBe(20);
  });

  it.each(expectedResolved)("resolves %s (%s / %s) with the reviewed canonical identity", (groupId, manufacturer, sourceProductName, canonicalProductId, productLineId, canonicalProductName, expectedAlias) => {
    const lookup = P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getBySourceGroupId(groupId);
    expect(lookup.status).toBe("FOUND");
    if (lookup.status !== "FOUND") return;
    expect(lookup.decision.sourceIdentity).toMatchObject({ manufacturer, productName: sourceProductName, productLineInterpretation: productLineId ? "CONFIRMED" : "CONFIRMED_NONE" });
    expect(lookup.decision.decision).toMatchObject({ status: "RESOLVED", canonicalProductId, productLineId, canonicalProductName });
    if (expectedAlias) expect(lookup.decision.decision.aliases).toContain(expectedAlias);
    else expect(lookup.decision.decision.aliases).toEqual([]);
    expect(validateTobaccoIdentityDecision(lookup.decision)).toMatchObject({ valid: true, applicable: true });
  });

  it.each(expectedResolved)("applies %s only by its exact source triple", (groupId, manufacturer, sourceProductName, canonicalProductId) => {
    const lookup = P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getBySourceGroupId(groupId);
    if (lookup.status !== "FOUND") throw new Error(`Missing fixture ${groupId}.`);
    const exact = applyTobaccoIdentityDecisions([record(lookup.decision)], P1_IDENTITY_DECISION_REGISTRY_BATCH_1);
    const nearMiss = applyTobaccoIdentityDecisions([{ ...record(lookup.decision), recordId: `near-${groupId}`, manufacturer, productName: `${sourceProductName} extra` }], P1_IDENTITY_DECISION_REGISTRY_BATCH_1);
    expect(exact.records[0]).toMatchObject({ identityStatus: "RESOLVED", canonicalProductId, confirmedDecision: true });
    expect(nearMiss).toMatchObject({ appliedDecisionCount: 0 });
  });

  it("keeps MustHave / Ананас manufacturer-only without guessing Pineapple Rings", () => {
    const lookup = P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getBySourceGroupId("identity-group-0022");
    expect(lookup).toMatchObject({ status: "FOUND", decision: { decision: { status: "MANUFACTURER_ONLY", manufacturerId: "musthave", productLineId: null, canonicalProductId: null }, review: { state: "NEEDS_MORE_EVIDENCE" } } });
    if (lookup.status !== "FOUND") return;
    expect(applyTobaccoIdentityDecisions([record(lookup.decision)], P1_IDENTITY_DECISION_REGISTRY_BATCH_1)).toMatchObject({ appliedDecisionCount: 0, skippedDecisionCount: 1 });
    expect(P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getBySourceIdentity("MustHave", null, "Ананас")).toMatchObject({ status: "FOUND" });
    expect(P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getBySourceIdentity("MustHave", null, "Pineapple Rings")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductId: "musthave-pineapple-rings" } } });
  });

  it("has 19 resolved and one manufacturer-only reviewed decision", () => {
    expect(P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getByStatus("RESOLVED")).toHaveLength(19);
    expect(P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getByStatus("MANUFACTURER_ONLY")).toHaveLength(1);
  });

  it("uses only evidence-backed line IDs and explicit no-line decisions", () => {
    const lineDecisions = P1_IDENTITY_DECISIONS_BATCH_1.filter(item => item.decision.productLineId !== null);
    expect(lineDecisions.map(item => item.decision.productLineId).sort()).toEqual(["blackburn-shock", "nash-black-line", "nash-white-line"]);
    expect(lineDecisions.every(item => item.sourceIdentity.productLineInterpretation === "CONFIRMED")).toBe(true);
    expect(P1_IDENTITY_DECISIONS_BATCH_1.filter(item => item.decision.status === "RESOLVED" && item.decision.productLineId === null).every(item => item.sourceIdentity.productLineInterpretation === "CONFIRMED_NONE")).toBe(true);
  });

  it("creates every canonical ID from its reviewed fields", () => {
    for (const decision of P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getByStatus("RESOLVED")) {
      expect(decision.decision.canonicalProductId).toBe(createCanonicalTobaccoProductId(decision.decision.manufacturerId!, decision.decision.productLineId, decision.decision.canonicalProductName!));
    }
  });

  it("has no invalid decision, duplicate, conflict or canonical collision", () => {
    const issues = auditTobaccoIdentityDecisions(P1_IDENTITY_DECISIONS_BATCH_1);
    expect(issues.filter(item => item.severity === "ERROR")).toEqual([]);
    expect(issues).toEqual([expect.objectContaining({ code: "DECISION_NOT_CONFIRMED", groupId: "identity-group-0022", severity: "WARNING" })]);
  });

  it("improves synthetic P1 coverage only for the 19 resolved products", () => {
    const before = P1_IDENTITY_DECISIONS_BATCH_1.map(record);
    const after = applyTobaccoIdentityDecisions(before, P1_IDENTITY_DECISION_REGISTRY_BATCH_1);
    expect(compareTobaccoIdentityCoverage(before, after)).toMatchObject({ resolvedDelta: 19, manufacturerOnlyDelta: -19, unresolvedDelta: 0, appliedDecisionCount: 19, skippedDecisionCount: 1, invalidDecisionCount: 0, conflictCount: 0 });
  });

  it("keeps НАШ products separate from Dogma identities", () => {
    const dogma = createDecisionFixture({ id: "dogma-batch-separation", manufacturer: "Dogma", manufacturerId: "dogma", productName: "Арбуз" });
    expect(P1_IDENTITY_DECISION_REGISTRY_BATCH_1.getBySourceIdentity("НАШ", null, "Арбуз")).toMatchObject({ status: "FOUND", decision: { decision: { manufacturerId: "nash", canonicalProductId: "nash-black-line-арбуз" } } });
    expect(dogma.decision.canonicalProductId).not.toBe("nash-black-line-арбуз");
  });

  it("maps the whole batch to public-safe output without evidence details", () => {
    const publicOutput = P1_IDENTITY_DECISIONS_BATCH_1.map(mapTobaccoIdentityDecisionToPublic);
    const serialized = JSON.stringify(publicOutput);
    expect(auditPublicTobaccoIdentityDecisions(publicOutput, ["reviewedByType", "reviewerNotes", "sourceUrl", "checkedAt", "htreviews.org", "musthave.ru", "blckburn.com"])).toEqual([]);
    expect(serialized).not.toContain("reviewedByType");
    expect(serialized).not.toContain("sourceReference");
  });
});
