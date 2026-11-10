import type { MixCatalogItem } from "./types";

export const findRelatedMixes = (source: MixCatalogItem, items: readonly MixCatalogItem[], limit = 3): readonly MixCatalogItem[] => {
  const productIds = new Set(source.components.map(component => component.canonicalProductId));
  const categories = new Set(source.dominantCategories);
  return items.filter(item => item.slug !== source.slug).map(item => ({ item, products: item.components.filter(component => productIds.has(component.canonicalProductId)).length, categories: item.dominantCategories.filter(category => categories.has(category)).length }))
    .filter(item => item.products > 0 || item.categories > 0)
    .sort((left, right) => right.products - left.products || right.categories - left.categories || right.item.predicted.qualityScore - left.item.predicted.qualityScore || left.item.slug.localeCompare(right.item.slug, "en"))
    .slice(0, limit).map(item => item.item);
};
