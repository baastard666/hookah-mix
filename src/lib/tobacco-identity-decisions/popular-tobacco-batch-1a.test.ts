import { describe, expect, it } from "vitest";
import { createTobaccoIdentityDecisionRegistry, validateTobaccoIdentityDecision } from "./index";
import { POPULAR_TOBACCO_IDENTITY_DECISIONS_BATCH_1A } from "./popular-tobacco-batch-1a";

describe("Popular Tobacco Expansion Batch 1A identity decisions", () => {
  it("contains thirteen new exact resolved identities without duplicating the already shipped Sour Berries", () => {
    expect(POPULAR_TOBACCO_IDENTITY_DECISIONS_BATCH_1A).toHaveLength(13);
    expect(POPULAR_TOBACCO_IDENTITY_DECISIONS_BATCH_1A.some(item => item.decision.canonicalProductId === "musthave-sour-berries")).toBe(false);
  });

  it("keeps JENT product lines distinct and records only evidence-backed aliases", () => {
    const byProduct = new Map(POPULAR_TOBACCO_IDENTITY_DECISIONS_BATCH_1A.map(item => [item.decision.canonicalProductName, item]));
    expect(byProduct.get("Currant WOW")?.decision).toMatchObject({ productLineId: "jent-classic", aliases: ["Кислая смородина"] });
    expect(byProduct.get("Grape Me")?.decision).toMatchObject({ productLineId: "jent-classic", aliases: ["Виноград и мята"] });
    expect(byProduct.get("Лесная Наливка")?.decision.productLineId).toBe("jent-alcohol");
    expect(byProduct.get("Follar")?.decision.productLineId).toBe("jent-herbal");
  });

  it("uses deterministic ASCII canonical IDs and has no internal collision", () => {
    const registry = createTobaccoIdentityDecisionRegistry(POPULAR_TOBACCO_IDENTITY_DECISIONS_BATCH_1A);
    expect(registry.getByCanonicalProductId("spectrum-mix-line-tsvetochnyi-miks").status).toBe("FOUND");
    expect(POPULAR_TOBACCO_IDENTITY_DECISIONS_BATCH_1A.every(item => validateTobaccoIdentityDecision(item).applicable)).toBe(true);
    expect(POPULAR_TOBACCO_IDENTITY_DECISIONS_BATCH_1A.every(item => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.decision.canonicalProductId ?? ""))).toBe(true);
  });
});
