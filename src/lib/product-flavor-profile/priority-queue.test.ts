import { describe, expect, it } from "vitest";
import { comparePriorityQueueCandidates, getManufacturerPriorityTier, sortByPriorityQueue } from "./priority-queue";
import type { PriorityQueueCandidate } from "./priority-queue";

const candidate = (overrides: Partial<PriorityQueueCandidate>): PriorityQueueCandidate => ({
  canonicalProductId: "z-product", manufacturer: "Unknown Brand", verifiedMixCount: 0, componentOccurrenceCount: 0, occurrenceCount: 0, ...overrides,
});

describe("getManufacturerPriorityTier", () => {
  it.each(["Darkside", "Chabacco", "MustHave", "Sapphire Crown", "Element"])("ranks %s as tier 1", manufacturer => {
    expect(getManufacturerPriorityTier(manufacturer)).toBe(1);
  });

  it.each(["Sebero", "Overdose", "Husky", "Brusko", "BlackBurn"])("ranks %s as tier 2", manufacturer => {
    expect(getManufacturerPriorityTier(manufacturer)).toBe(2);
  });

  it("ranks any other manufacturer as tier 3 by default", () => {
    expect(getManufacturerPriorityTier("Jam")).toBe(3);
    expect(getManufacturerPriorityTier("Hook")).toBe(3);
    expect(getManufacturerPriorityTier("Не указан")).toBe(3);
  });

  it("normalizes case and whitespace without fuzzy matching", () => {
    expect(getManufacturerPriorityTier("  darkside  ")).toBe(1);
    expect(getManufacturerPriorityTier("SAPPHIRE   CROWN")).toBe(1);
    expect(getManufacturerPriorityTier("Darksid")).toBe(3);
  });
});

describe("comparePriorityQueueCandidates", () => {
  it("never lets the manufacturer tier override the primary metrics", () => {
    const tier3HighCount = candidate({ canonicalProductId: "b", manufacturer: "Jam", verifiedMixCount: 2 });
    const tier1LowCount = candidate({ canonicalProductId: "a", manufacturer: "Darkside", verifiedMixCount: 1 });
    expect(comparePriorityQueueCandidates(tier3HighCount, tier1LowCount)).toBeLessThan(0);
  });

  it("uses manufacturer tier only to break a full tie on the primary metrics", () => {
    const tier1 = candidate({ canonicalProductId: "b", manufacturer: "Darkside", verifiedMixCount: 1, componentOccurrenceCount: 1, occurrenceCount: 2 });
    const tier2 = candidate({ canonicalProductId: "a", manufacturer: "BlackBurn", verifiedMixCount: 1, componentOccurrenceCount: 1, occurrenceCount: 2 });
    expect(comparePriorityQueueCandidates(tier1, tier2)).toBeLessThan(0);
  });

  it("falls back to ascending canonicalProductId when metrics and tier are equal", () => {
    const first = candidate({ canonicalProductId: "aaa-product", manufacturer: "Darkside", verifiedMixCount: 1 });
    const second = candidate({ canonicalProductId: "zzz-product", manufacturer: "Darkside", verifiedMixCount: 1 });
    expect(comparePriorityQueueCandidates(first, second)).toBeLessThan(0);
  });

  it("sorts a mixed candidate list deterministically", () => {
    const candidates = [
      candidate({ canonicalProductId: "low-count", manufacturer: "Darkside", verifiedMixCount: 1, componentOccurrenceCount: 1, occurrenceCount: 1 }),
      candidate({ canonicalProductId: "tier3-tie", manufacturer: "Jam", verifiedMixCount: 1, componentOccurrenceCount: 1, occurrenceCount: 2 }),
      candidate({ canonicalProductId: "tier1-tie", manufacturer: "Chabacco", verifiedMixCount: 1, componentOccurrenceCount: 1, occurrenceCount: 2 }),
      candidate({ canonicalProductId: "highest", manufacturer: "Hook", verifiedMixCount: 3, componentOccurrenceCount: 1, occurrenceCount: 1 }),
    ];
    expect(sortByPriorityQueue(candidates).map(item => item.canonicalProductId)).toEqual(["highest", "tier1-tie", "tier3-tie", "low-count"]);
  });

  it("does not mutate the input array", () => {
    const candidates = [candidate({ canonicalProductId: "b" }), candidate({ canonicalProductId: "a" })];
    const before = [...candidates];
    sortByPriorityQueue(candidates);
    expect(candidates).toEqual(before);
  });
});
