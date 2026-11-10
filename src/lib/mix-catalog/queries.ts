import { filterMixCatalogItems, matchesMixCatalogSearch } from "./filters";
import { getCatalogItem, hasCatalogItem, listCatalogItems } from "./registry";
import type { MixCatalogFilters, MixCatalogItem } from "./types";

export const listMixCatalogItems = (): readonly Readonly<MixCatalogItem>[] => listCatalogItems();
export const getMixCatalogItemBySlug = (slug: string): Readonly<MixCatalogItem> | null => getCatalogItem(slug);
export const hasMixCatalogItem = (slug: string): boolean => hasCatalogItem(slug);
export const findMixCatalogItemsByProductId = (canonicalProductId: string): readonly Readonly<MixCatalogItem>[] => listCatalogItems().filter(item => item.components.some(component => component.canonicalProductId === canonicalProductId));
export const searchMixCatalogItems = (query: string): readonly Readonly<MixCatalogItem>[] => listCatalogItems().filter(item => matchesMixCatalogSearch(item, query));
export const filterCatalogMixes = (filters: MixCatalogFilters): readonly Readonly<MixCatalogItem>[] => filterMixCatalogItems(listCatalogItems(), filters);
