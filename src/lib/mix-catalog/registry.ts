import snapshot from "../../data/verified-mix-catalog.generated.json";
import type { MixCatalogItem, MixCatalogSnapshot } from "./types";

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(item => deepFreeze(item));
  }
  return value;
};
const catalog = deepFreeze(snapshot as MixCatalogSnapshot);
if (catalog.schemaVersion !== "verified-mix-catalog-v1") throw new Error("Неподдерживаемая версия generated Mix Catalog snapshot.");
const bySlug = new Map(catalog.items.map(item => [item.slug, item]));

const copy = <T>(value: T): Readonly<T> => deepFreeze(structuredClone(value));
export const getMixCatalogSnapshot = (): Readonly<MixCatalogSnapshot> => copy(catalog);
export const listCatalogItems = (): readonly Readonly<MixCatalogItem>[] => catalog.items.map(copy);
export const getCatalogItem = (slug: string): Readonly<MixCatalogItem> | null => { const item = bySlug.get(slug); return item ? copy(item) : null; };
export const hasCatalogItem = (slug: string): boolean => bySlug.has(slug);
