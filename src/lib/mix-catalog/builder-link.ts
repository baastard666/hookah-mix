import type { MixCatalogItem } from "./types";

export type ExactCatalogFlavor = Readonly<{ canonicalProductId: string; flavorId: number }>;

/**
 * Builds a constructor URL only when every recipe component has an exact
 * canonical-product match in the local catalog. It deliberately has no
 * fallback by name, brand, or fuzzy similarity.
 */
export const createExactBuilderHref = (
  item: Readonly<MixCatalogItem>,
  flavors: readonly ExactCatalogFlavor[],
): string | null => {
  const flavorIdByCanonicalId = new Map(flavors.map(flavor => [flavor.canonicalProductId, flavor.flavorId]));
  const rows = item.components.map(component => {
    const flavorId = flavorIdByCanonicalId.get(component.canonicalProductId);
    return flavorId === undefined ? null : `${flavorId}:${component.percentage}`;
  });

  return rows.some(row => row === null) ? null : `/builder?components=${rows.join(",")}`;
};
