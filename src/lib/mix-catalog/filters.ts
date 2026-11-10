import { categoryLabels } from "../flavor-knowledge";
import type { MixCatalogCard, MixCatalogFilters, MixCatalogItem, MixCatalogSort, MixCatalogStrengthBucket } from "./types";

export const strengthBucketFor = (value: number | null): MixCatalogStrengthBucket | null => value === null ? null : value < 3.5 ? "LIGHT" : value < 6.5 ? "MEDIUM" : "STRONG";
export const strengthBucketLabel = (bucket: MixCatalogStrengthBucket): string => ({ LIGHT: "Лёгкая", MEDIUM: "Средняя", STRONG: "Крепкая" })[bucket];
export const categoryLabel = (category: keyof typeof categoryLabels): string => categoryLabels[category];

const normalized = (value: string): string => value.normalize("NFKC").toLocaleLowerCase("ru-RU").trim();
const searchText = (item: MixCatalogItem): string => normalized([
  item.title, ...item.tags, ...item.dominantCategories.map(category => categoryLabels[category]),
  ...item.components.flatMap(component => [component.manufacturer, component.productName, component.productLine ?? ""]),
].join(" "));

export const matchesMixCatalogSearch = (item: MixCatalogItem, query: string): boolean => {
  const tokens = normalized(query).split(/\s+/).filter(Boolean);
  const haystack = searchText(item);
  return tokens.every(token => haystack.includes(token));
};

const compareNullable = (left: number | null, right: number | null, direction: 1 | -1): number => {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return (left - right) * direction;
};
export const sortMixCatalogItems = (items: readonly MixCatalogItem[], sort: MixCatalogSort = "default"): readonly MixCatalogItem[] => [...items].sort((left, right) => {
  const tie = () => left.title.localeCompare(right.title, "ru") || left.slug.localeCompare(right.slug, "en");
  if (sort === "quality-desc" || sort === "default") return right.predicted.qualityScore - left.predicted.qualityScore || right.predicted.dataQuality - left.predicted.dataQuality || tie();
  if (sort === "quality-asc") return left.predicted.qualityScore - right.predicted.qualityScore || tie();
  if (sort === "strength-desc") return compareNullable(left.profile.strength, right.profile.strength, -1) || tie();
  if (sort === "strength-asc") return compareNullable(left.profile.strength, right.profile.strength, 1) || tie();
  if (sort === "components-desc") return right.componentCount - left.componentCount || tie();
  return left.componentCount - right.componentCount || tie();
});

export const filterMixCatalogItems = (items: readonly MixCatalogItem[], filters: MixCatalogFilters = {}): readonly MixCatalogItem[] => sortMixCatalogItems(items.filter(item => {
  if (filters.q && !matchesMixCatalogSearch(item, filters.q)) return false;
  if (filters.componentCount === "2" && item.componentCount !== 2) return false;
  if (filters.componentCount === "3" && item.componentCount !== 3) return false;
  if (filters.componentCount === "4+" && item.componentCount < 4) return false;
  if (filters.category && !item.dominantCategories.includes(filters.category)) return false;
  if (filters.strength && strengthBucketFor(item.profile.strength) !== filters.strength) return false;
  if (filters.trait === "sour" && (item.profile.sourness === null || item.profile.sourness < 5)) return false;
  if (filters.trait === "sweet" && (item.profile.sweetness === null || item.profile.sweetness < 5)) return false;
  if (filters.trait === "fresh" && (item.profile.freshness === null || item.profile.freshness < 5)) return false;
  return true;
}), filters.sort);

export const toMixCatalogCard = (item: MixCatalogItem): MixCatalogCard => ({
  slug: item.slug, title: item.title, componentCount: item.componentCount, tags: item.tags, dominantCategories: item.dominantCategories,
  components: item.components.map(component => ({ manufacturer: component.manufacturer, productName: component.productName, percentage: component.percentage })),
  predictedQualityScore: item.predicted.qualityScore, predictionConfidenceLabel: item.predicted.confidenceLabel, dataQuality: item.predicted.dataQuality,
  strength: item.profile.strength, sourness: item.profile.sourness, sweetness: item.profile.sweetness, freshness: item.profile.freshness,
});
