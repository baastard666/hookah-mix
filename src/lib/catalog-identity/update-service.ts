import { listManufacturerProfiles, listProductLineProfiles } from "../tobacco-profile";
import { createResolvedCanonicalProductId, createManufacturerOnlyCanonicalProductId, normalizeCanonicalProductName } from "./canonical-product-id";
import { createPrismaCatalogIdentityStore } from "./prisma-store";
import type { CatalogIdentityStore, PersistedCatalogIdentity, UpdateCatalogTobaccoIdentityInput, UpdateCatalogTobaccoIdentityResult } from "./types";

export const updateCatalogTobaccoIdentity = async (input: UpdateCatalogTobaccoIdentityInput, store: CatalogIdentityStore = createPrismaCatalogIdentityStore()): Promise<UpdateCatalogTobaccoIdentityResult> => {
  const manufacturer = listManufacturerProfiles().find(item => item.manufacturerId === input.manufacturerId);
  if (!manufacturer) return { success: false, errors: [{ code: "UNKNOWN_MANUFACTURER", message: `Unknown manufacturerId: ${input.manufacturerId}` }] };
  const name = normalizeCanonicalProductName(input.canonicalProductName);
  if (!name) return { success: false, errors: [{ code: "EMPTY_PRODUCT_NAME", message: "Canonical product name is required" }] };

  const requestedLine = input.productLineId?.trim() || null;
  const allLines = listProductLineProfiles();
  const line = requestedLine ? allLines.find(item => item.productLineId === requestedLine) : null;
  if (requestedLine && !line) return { success: false, errors: [{ code: "UNKNOWN_PRODUCT_LINE", message: `Unknown productLineId: ${requestedLine}` }] };
  if (line && line.manufacturerId !== manufacturer.manufacturerId) return { success: false, errors: [{ code: "PRODUCT_LINE_DOES_NOT_BELONG_TO_MANUFACTURER", message: `${line.productLineId} does not belong to ${manufacturer.manufacturerId}` }] };

  const productId = line ? createResolvedCanonicalProductId(line.productLineId, name) : createManufacturerOnlyCanonicalProductId(manufacturer.manufacturerId, name);
  if (!productId) return { success: false, errors: [{ code: "EMPTY_PRODUCT_NAME", message: "Canonical product name cannot produce an ID" }] };
  return store.transaction(async transaction => {
    const current = await transaction.findById(input.catalogId);
    if (!current) return { success: false, errors: [{ code: "CATALOG_ENTRY_NOT_FOUND", message: `Catalog entry not found: ${input.catalogId}` }] };
    const duplicate = await transaction.findByCanonicalProductId(productId);
    if (duplicate && duplicate.catalogId !== input.catalogId) return { success: false, errors: [{ code: "DUPLICATE_CANONICAL_PRODUCT_ID", message: `${productId} is already used by catalog entry ${duplicate.catalogId}` }] };
    const identity: PersistedCatalogIdentity = { manufacturerId: manufacturer.manufacturerId, productLineId: line?.productLineId ?? null, canonicalProductName: name, canonicalProductId: productId, identityStatus: line ? "RESOLVED" : "MANUFACTURER_ONLY", identityVerified: input.identityVerified ?? current.identityVerified, catalogEntryType: current.catalogEntryType };
    const record = await transaction.updateIdentity(input.catalogId, identity);
    return { success: true, record };
  });
};
