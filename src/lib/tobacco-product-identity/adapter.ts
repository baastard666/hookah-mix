import type { CatalogTobaccoIdentityInput } from "./types";

export type CatalogFlavorForIdentity = { readonly id: string | number; readonly name: string; readonly brand: string | { readonly name: string }; readonly productLine?: string | null };
export const adaptCatalogTobaccoForIdentity = (flavor: CatalogFlavorForIdentity): CatalogTobaccoIdentityInput => ({ catalogId: flavor.id, brand: typeof flavor.brand === "string" ? flavor.brand : flavor.brand.name, productLine: flavor.productLine ?? null, name: flavor.name });
