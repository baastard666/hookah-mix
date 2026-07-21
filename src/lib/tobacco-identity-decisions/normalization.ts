import { normalizeTobaccoIdentityText } from "../tobacco-product-identity";

const slugTobaccoIdentityText = (value: string): string => normalizeTobaccoIdentityText(value).replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");

export const normalizeDecisionText = (value: string | null | undefined): string => value?.trim() ? normalizeTobaccoIdentityText(value) : "";
export const createSourceIdentityKey = (manufacturer: string | null, productLine: string | null, productName: string | null): string => JSON.stringify([normalizeDecisionText(manufacturer), normalizeDecisionText(productLine), normalizeDecisionText(productName)]);
export const createCanonicalTobaccoProductId = (manufacturerId: string, productLineId: string | null, productName: string): string | null => {
  const manufacturer = slugTobaccoIdentityText(manufacturerId);
  const rawLine = productLineId ? slugTobaccoIdentityText(productLineId) : "";
  const line = rawLine.startsWith(`${manufacturer}-`) ? rawLine.slice(manufacturer.length + 1) : rawLine;
  const product = slugTobaccoIdentityText(productName);
  if (!manufacturer || !product || (productLineId !== null && !line)) return null;
  return [manufacturer, line, product].filter(Boolean).join("-");
};
export const deepFreezeClone = <T>(value: T): Readonly<T> => {
  const clone = structuredClone(value);
  const freeze = (item: unknown): void => { if (item !== null && typeof item === "object" && !Object.isFrozen(item)) { Object.freeze(item); Object.values(item as Record<string, unknown>).forEach(freeze); } };
  freeze(clone); return clone;
};
