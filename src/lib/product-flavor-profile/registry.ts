import { PRODUCT_FLAVOR_PROFILES_BATCH_1 } from "./batch-1";
import { PRODUCT_FLAVOR_PROFILES_BATCH_2 } from "./batch-2";
import { ProductFlavorProfileError } from "./errors";
import { validateProductFlavorProfiles } from "./validation";
import type { ProductFlavorProfile } from "./types";

const profiles: readonly ProductFlavorProfile[] = [
  ...PRODUCT_FLAVOR_PROFILES_BATCH_1,
  ...PRODUCT_FLAVOR_PROFILES_BATCH_2,
];

const issues = validateProductFlavorProfiles(profiles);
if (issues.length) throw new ProductFlavorProfileError("Product flavor profile registry is invalid.", issues);

const deepFreeze = <T>(item: T): Readonly<T> => {
  if (item !== null && typeof item === "object" && !Object.isFrozen(item)) {
    Object.freeze(item);
    Object.values(item as Record<string, unknown>).forEach(nested => deepFreeze(nested));
  }
  return item;
};

export const PRODUCT_FLAVOR_PROFILE_REGISTRY: readonly ProductFlavorProfile[] = deepFreeze([...profiles]);
