export type ManufacturerPriorityTier = 1 | 2 | 3;

const TIER_1_MANUFACTURERS = ["Darkside", "Chabacco", "MustHave", "Sapphire Crown", "Element"] as const;
const TIER_2_MANUFACTURERS = ["Sebero", "Overdose", "Husky", "Brusko", "BlackBurn"] as const;
const DEFAULT_TIER: ManufacturerPriorityTier = 3;

const normalizeManufacturerName = (value: string): string => value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");

const buildTierMap = (names: readonly string[], tier: ManufacturerPriorityTier): ReadonlyMap<string, ManufacturerPriorityTier> =>
  new Map(names.map(name => [normalizeManufacturerName(name), tier]));

const MANUFACTURER_TIER_MAP: ReadonlyMap<string, ManufacturerPriorityTier> = new Map([
  ...buildTierMap(TIER_1_MANUFACTURERS, 1),
  ...buildTierMap(TIER_2_MANUFACTURERS, 2),
]);

/**
 * Explicit, reviewable tie-break for the Product Flavor Profile Registry priority queue (batch 3+).
 * Applies only after the unchanged primary sort (verifiedMixCount -> componentOccurrenceCount ->
 * occurrenceCount, all descending) has been exhausted and candidates still tie on all three.
 * Manufacturers with richer official/independent sources (tier 1, then tier 2) are preferred over
 * the remaining catalog (tier 3) so future batches favor products more likely to yield real evidence.
 * Exact normalized name match only - no fuzzy/alias resolution, consistent with the rest of the project.
 */
export const getManufacturerPriorityTier = (manufacturer: string): ManufacturerPriorityTier =>
  MANUFACTURER_TIER_MAP.get(normalizeManufacturerName(manufacturer)) ?? DEFAULT_TIER;

export type PriorityQueueCandidate = {
  readonly canonicalProductId: string;
  readonly manufacturer: string;
  readonly verifiedMixCount: number;
  readonly componentOccurrenceCount: number;
  readonly occurrenceCount: number;
};

/**
 * Deterministic comparator for the batch 3+ priority queue.
 * Order: verifiedMixCount desc -> componentOccurrenceCount desc -> occurrenceCount desc
 *   -> manufacturer priority tier asc (1 = highest priority) -> canonicalProductId asc.
 * The manufacturer-tier step only breaks ties left after the unchanged primary metrics;
 * it never overrides them. Batches 1-2 were selected before this tie-break existed and used a
 * plain ascending canonicalProductId/sourceGroupId tie-break instead - they are not recomputed.
 */
export const comparePriorityQueueCandidates = (a: PriorityQueueCandidate, b: PriorityQueueCandidate): number =>
  b.verifiedMixCount - a.verifiedMixCount
  || b.componentOccurrenceCount - a.componentOccurrenceCount
  || b.occurrenceCount - a.occurrenceCount
  || getManufacturerPriorityTier(a.manufacturer) - getManufacturerPriorityTier(b.manufacturer)
  || a.canonicalProductId.localeCompare(b.canonicalProductId, "en");

export const sortByPriorityQueue = <T extends PriorityQueueCandidate>(candidates: readonly T[]): readonly T[] =>
  [...candidates].sort(comparePriorityQueueCandidates);
