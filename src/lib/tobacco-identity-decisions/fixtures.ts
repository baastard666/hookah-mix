import { createCanonicalTobaccoProductId, normalizeDecisionText } from "./normalization";
import type { ProductLineInterpretation, TobaccoIdentityConfidence, TobaccoIdentityDecision, TobaccoIdentityDecisionStatus, TobaccoIdentitySourcePriority } from "./types";

type FixtureOverrides = {
  readonly id?: string; readonly manufacturer?: string; readonly productLine?: string | null; readonly productName?: string; readonly manufacturerId?: string | null; readonly productLineId?: string | null;
  readonly status?: TobaccoIdentityDecisionStatus; readonly priority?: TobaccoIdentitySourcePriority; readonly reviewState?: TobaccoIdentityDecision["review"]["state"];
  readonly interpretation?: ProductLineInterpretation; readonly evidence?: TobaccoIdentityDecision["evidence"]; readonly canonicalProductId?: string | null; readonly confidence?: TobaccoIdentityConfidence;
};
export const createDecisionFixture = (overrides: FixtureOverrides = {}): TobaccoIdentityDecision => {
  const manufacturer = overrides.manufacturer ?? "BlackBurn"; const productLine = overrides.productLine ?? null; const productName = overrides.productName ?? "Raspberry Shock";
  const manufacturerId = overrides.manufacturerId === undefined ? "blackburn" : overrides.manufacturerId; const productLineId = overrides.productLineId === undefined ? null : overrides.productLineId;
  const status = overrides.status ?? "RESOLVED"; const confidence = overrides.confidence ?? "HIGH";
  const canonicalProductId = overrides.canonicalProductId === undefined && status === "RESOLVED" && manufacturerId ? createCanonicalTobaccoProductId(manufacturerId, productLineId, productName) : overrides.canonicalProductId ?? null;
  return {
    id: overrides.id ?? `decision-${normalizeDecisionText(manufacturer).replaceAll(" ", "-")}-${normalizeDecisionText(productName).replaceAll(" ", "-")}`,
    sourceIdentity: { manufacturer, productLine, productName, normalizedManufacturer: normalizeDecisionText(manufacturer), normalizedProductLine: normalizeDecisionText(productLine), normalizedProductName: normalizeDecisionText(productName), sourceGroupId: overrides.id ?? `group-${normalizeDecisionText(manufacturer)}-${normalizeDecisionText(productName)}`, sourcePriority: overrides.priority ?? "P1", sourceSheets: ["fixture"], sourceRows: [1], productLineInterpretation: overrides.interpretation ?? (productLineId ? "CONFIRMED" : "CONFIRMED_NONE") },
    decision: { status, manufacturerId: status === "UNRESOLVED" || status === "AMBIGUOUS" || status === "REJECTED" ? null : manufacturerId, productLineId: status === "RESOLVED" ? productLineId : null, canonicalProductId, canonicalManufacturerName: manufacturerId ? manufacturer : null, canonicalProductLineName: productLineId ? productLine : null, canonicalProductName: status === "RESOLVED" ? productName : null, aliases: [] },
    evidence: overrides.evidence ?? [{ sourceType: "INTERNAL_EXPERT_CONFIRMATION", sourceReference: "synthetic-fixture", internalReference: "fixture-only", confidence, checkedAt: "2026-01-01", publicSafe: false }],
    review: { state: overrides.reviewState ?? "CONFIRMED", reviewedByType: "INTERNAL_EXPERT", reviewedAt: "2026-01-01", reviewerNotes: null },
    metadata: { version: "tobacco-identity-decision-v1", createdAt: null, updatedAt: null },
  };
};

export const createTobaccoIdentityDecisionFixtures = () => {
  const withLine = createDecisionFixture({ id: "resolved-with-line", manufacturer: "Darkside", productLine: "Core", productName: "Blueberry", manufacturerId: "darkside", productLineId: "darkside-core", interpretation: "CONFIRMED" });
  const withoutLine = createDecisionFixture({ id: "resolved-without-line" });
  const manufacturerOnly = createDecisionFixture({ id: "manufacturer-only", manufacturer: "MustHave", productName: "Pineapple Rings", manufacturerId: "musthave", status: "MANUFACTURER_ONLY", interpretation: "UNKNOWN", canonicalProductId: null });
  const unresolved = createDecisionFixture({ id: "unresolved", manufacturer: "Unknown", manufacturerId: null, productName: "Mystery", status: "UNRESOLVED", reviewState: "UNREVIEWED", evidence: [], interpretation: "UNKNOWN" });
  const ambiguous = createDecisionFixture({ id: "ambiguous", status: "AMBIGUOUS", reviewState: "AMBIGUOUS", canonicalProductId: null, interpretation: "AMBIGUOUS" });
  const rejected = createDecisionFixture({ id: "rejected", status: "REJECTED", canonicalProductId: null, interpretation: "UNKNOWN" });
  const unconfirmed = createDecisionFixture({ id: "unconfirmed", productName: "Unconfirmed Product", reviewState: "UNREVIEWED" });
  const missingEvidence = createDecisionFixture({ id: "missing-evidence", evidence: [] });
  const missingConfidence = createDecisionFixture({ id: "missing-confidence", evidence: [{ sourceType: "INTERNAL_EXPERT_CONFIRMATION", sourceReference: "fixture", confidence: "" as TobaccoIdentityConfidence, checkedAt: "2026-01-01", publicSafe: false }] });
  const missingCanonicalProductId = createDecisionFixture({ id: "missing-canonical-id", canonicalProductId: null });
  const collisionA = createDecisionFixture({ id: "collision-a", productName: "Collision A", canonicalProductId: "blackburn-collision" });
  const collisionB = createDecisionFixture({ id: "collision-b", productName: "Collision B", canonicalProductId: "blackburn-collision" });
  const duplicate = structuredClone(withoutLine);
  const conflict = createDecisionFixture({ id: "conflict", status: "MANUFACTURER_ONLY", canonicalProductId: null });
  const exactManufacturerAliasOnly = createDecisionFixture({ id: "alias-only", manufacturer: "MustHave", manufacturerId: "musthave", productName: "Unconfirmed Product", status: "MANUFACTURER_ONLY", reviewState: "UNREVIEWED", evidence: [], interpretation: "UNKNOWN" });
  const nashLavender = createDecisionFixture({ id: "nash-lavender", manufacturer: "НАШ", manufacturerId: "nash", productName: "Лаванда" });
  const dogmaLavender = createDecisionFixture({ id: "dogma-lavender", manufacturer: "Dogma", manufacturerId: "dogma", productName: "Крымская лаванда" });
  const elementEarth = createDecisionFixture({ id: "element-earth", manufacturer: "Element Earth", manufacturerId: null, productName: "Example", status: "UNRESOLVED", reviewState: "UNREVIEWED", evidence: [], interpretation: "EMBEDDED_IN_MANUFACTURER" });
  const deusPerfume = createDecisionFixture({ id: "deus-perfume", manufacturer: "Deus Perfume", manufacturerId: null, productName: "Example", status: "UNRESOLVED", reviewState: "UNREVIEWED", evidence: [], interpretation: "EMBEDDED_IN_MANUFACTURER" });
  const mrBrew = createDecisionFixture({ id: "mr-brew", manufacturer: "Mr Brew Напиточный", manufacturerId: null, productName: "Example", status: "UNRESOLVED", reviewState: "UNREVIEWED", evidence: [], interpretation: "EMBEDDED_IN_MANUFACTURER" });
  const p0 = createDecisionFixture({ id: "p0", priority: "P0" }); const p1 = createDecisionFixture({ id: "p1", priority: "P1", productName: "P1 Product" });
  const p2Blocked = createDecisionFixture({ id: "p2", priority: "P2", productName: "P2 Product" }); const p3Blocked = createDecisionFixture({ id: "p3", priority: "P3", productName: "P3 Product" });
  const userPriority = createDecisionFixture({ id: "user-priority", priority: "USER_PRIORITY", productName: "User Product" });
  const privateEvidence = createDecisionFixture({ id: "private-evidence", productName: "Private", evidence: [{ sourceType: "INTERNAL_EXPERT_CONFIRMATION", sourceReference: "private-reference", sourceUrl: "https://private.example/item", internalReference: "author-real-name", confidence: "HIGH", checkedAt: "2026-01-01", notes: "private notes", publicSafe: false }] });
  return { withLine, withoutLine, manufacturerOnly, unresolved, ambiguous, rejected, unconfirmed, missingEvidence, missingConfidence, missingCanonicalProductId, collisionA, collisionB, duplicate, conflict, exactManufacturerAliasOnly, nashLavender, dogmaLavender, elementEarth, deusPerfume, mrBrew, p0, p1, p2Blocked, p3Blocked, userPriority, privateEvidence };
};
