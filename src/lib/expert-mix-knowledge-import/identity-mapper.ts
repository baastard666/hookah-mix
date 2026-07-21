import { resolveCatalogTobaccoIdentity } from "../tobacco-product-identity";
import { createManufacturerOnlyCanonicalProductId } from "../catalog-identity";
import type { ExpertMixIdentityStatus } from "../expert-mix-knowledge";

export type ImportIdentityInput = { readonly explicitCanonicalProductId?: string | null; readonly manufacturer?: string | null; readonly productLine?: string | null; readonly productName?: string | null; readonly displayName?: string | null };
export type ImportedIdentity = { readonly status: ExpertMixIdentityStatus; readonly canonicalProductId: string | null; readonly manufacturerId: string | null; readonly productLineId: string | null; readonly canonicalProductName: string | null };
const validCanonicalId = (value: string): boolean => /^[\p{L}\p{N}][\p{L}\p{N}._-]*$/u.test(value);

export const resolveImportedTobaccoIdentity = (input: ImportIdentityInput): ImportedIdentity => {
  const explicit = input.explicitCanonicalProductId?.trim();
  if (explicit && validCanonicalId(explicit) && input.productName?.trim()) return { status: "RESOLVED", canonicalProductId: explicit, manufacturerId: input.manufacturer?.trim() || null, productLineId: input.productLine?.trim() || null, canonicalProductName: input.productName.trim() };
  const resolution = resolveCatalogTobaccoIdentity({ brand: input.manufacturer, productLine: input.productLine, name: input.productName ?? input.displayName });
  if (resolution.status === "RESOLVED") return { status: "RESOLVED", canonicalProductId: resolution.productId, manufacturerId: resolution.manufacturerId, productLineId: resolution.productLineId, canonicalProductName: resolution.productName };
  if (resolution.status === "MANUFACTURER_ONLY") return { status: "MANUFACTURER_ONLY", canonicalProductId: resolution.productName ? createManufacturerOnlyCanonicalProductId(resolution.manufacturerId, resolution.productName) : null, manufacturerId: resolution.manufacturerId, productLineId: null, canonicalProductName: resolution.productName };
  return { status: resolution.status === "AMBIGUOUS" ? "AMBIGUOUS" : "UNRESOLVED", canonicalProductId: null, manufacturerId: null, productLineId: null, canonicalProductName: input.productName?.trim() || null };
};
