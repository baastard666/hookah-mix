import { normalizeTobaccoIdentityText } from "../tobacco-product-identity";
import { createAsciiCanonicalTobaccoProductId } from "./canonical-id";

export const normalizeDecisionText = (value: string | null | undefined): string => value?.trim() ? normalizeTobaccoIdentityText(value) : "";
export const createSourceIdentityKey = (manufacturer: string | null, productLine: string | null, productName: string | null): string => JSON.stringify([normalizeDecisionText(manufacturer), normalizeDecisionText(productLine), normalizeDecisionText(productName)]);
export const createCanonicalTobaccoProductId = createAsciiCanonicalTobaccoProductId;
export const deepFreezeClone = <T>(value: T): Readonly<T> => {
  const clone = structuredClone(value);
  const freeze = (item: unknown): void => { if (item !== null && typeof item === "object" && !Object.isFrozen(item)) { Object.freeze(item); Object.values(item as Record<string, unknown>).forEach(freeze); } };
  freeze(clone); return clone;
};
