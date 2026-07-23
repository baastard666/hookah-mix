import { PRODUCT_FLAVOR_PROFILE_REGISTRY } from "./registry";
import type { ProductFlavorProfile } from "./types";

const cloneFrozen = <T>(value: T): Readonly<T> => {
  const clone = structuredClone(value);
  const freeze = (item: unknown): void => {
    if (item !== null && typeof item === "object" && !Object.isFrozen(item)) {
      Object.freeze(item);
      Object.values(item as Record<string, unknown>).forEach(freeze);
    }
  };
  freeze(clone);
  return clone;
};

const byCanonicalProductId = new Map(PRODUCT_FLAVOR_PROFILE_REGISTRY.map(profile => [profile.canonicalProductId, profile]));

export const getProductFlavorProfile = (canonicalProductId: string): Readonly<ProductFlavorProfile> | null => {
  const profile = byCanonicalProductId.get(canonicalProductId);
  return profile ? cloneFrozen(profile) : null;
};

export const listProductFlavorProfiles = (): readonly Readonly<ProductFlavorProfile>[] =>
  cloneFrozen([...PRODUCT_FLAVOR_PROFILE_REGISTRY].sort((a, b) => a.canonicalProductId.localeCompare(b.canonicalProductId, "en")));

export const hasProductFlavorProfile = (canonicalProductId: string): boolean => byCanonicalProductId.has(canonicalProductId);
