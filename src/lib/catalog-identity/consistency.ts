import { listManufacturerProfiles, listProductLineProfiles } from "../tobacco-profile";
import { createManufacturerOnlyCanonicalProductId, createResolvedCanonicalProductId } from "./canonical-product-id";
import type { CatalogIdentityConsistencyIssue, CatalogIdentityConsistencyResult, CatalogIdentityRecord } from "./types";

export const verifyPersistedCatalogIdentities = (records: readonly CatalogIdentityRecord[]): CatalogIdentityConsistencyResult => {
  const manufacturers = listManufacturerProfiles();
  const lines = listProductLineProfiles();
  const issues: CatalogIdentityConsistencyIssue[] = [];
  const add = (record: CatalogIdentityRecord, code: CatalogIdentityConsistencyIssue["code"], message: string): void => { issues.push({ catalogId: record.catalogId, code, message }); };

  for (const record of records) {
    const manufacturer = record.manufacturerId ? manufacturers.find(item => item.manufacturerId === record.manufacturerId) : null;
    const line = record.productLineId ? lines.find(item => item.productLineId === record.productLineId) : null;
    if (record.manufacturerId && !manufacturer) add(record, "UNKNOWN_MANUFACTURER", `Unknown manufacturerId: ${record.manufacturerId}`);
    if (record.productLineId && !line) add(record, "UNKNOWN_PRODUCT_LINE", `Unknown productLineId: ${record.productLineId}`);
    if (manufacturer && line && line.manufacturerId !== manufacturer.manufacturerId) add(record, "PRODUCT_LINE_DOES_NOT_BELONG_TO_MANUFACTURER", `${line.productLineId} does not belong to ${manufacturer.manufacturerId}`);

    if (record.identityStatus === "RESOLVED") {
      if (!record.manufacturerId || !record.productLineId || !record.canonicalProductName || !record.canonicalProductId) add(record, "INCOMPLETE_RESOLVED_IDENTITY", "RESOLVED identity requires manufacturer, line, product name and product ID");
      else if (createResolvedCanonicalProductId(record.productLineId, record.canonicalProductName) !== record.canonicalProductId) add(record, "INVALID_CANONICAL_PRODUCT_ID", "Resolved canonicalProductId does not match the current algorithm");
    }
    if (record.identityStatus === "MANUFACTURER_ONLY") {
      if (!record.manufacturerId || record.productLineId || !record.canonicalProductName || !record.canonicalProductId) add(record, "INVALID_MANUFACTURER_ONLY_IDENTITY", "MANUFACTURER_ONLY requires manufacturer and product data without a line");
      else if (createManufacturerOnlyCanonicalProductId(record.manufacturerId, record.canonicalProductName) !== record.canonicalProductId) add(record, "INVALID_CANONICAL_PRODUCT_ID", "Manufacturer-only canonicalProductId does not match the current algorithm");
    }
    if ((record.identityStatus === "UNRESOLVED" || record.identityStatus === "AMBIGUOUS" || record.identityStatus === "INVALID") && record.canonicalProductId) add(record, "UNRESOLVED_HAS_CANONICAL_PRODUCT_ID", `${record.identityStatus} identity must not have canonicalProductId`);
    if (record.identityVerified && record.identityStatus !== "RESOLVED" && record.identityStatus !== "MANUFACTURER_ONLY") add(record, "INVALID_VERIFIED_IDENTITY", "Only complete resolved or manufacturer-only identity can be verified");
  }

  const byProductId = new Map<string, CatalogIdentityRecord[]>();
  records.filter(record => record.canonicalProductId).forEach(record => byProductId.set(record.canonicalProductId!, [...(byProductId.get(record.canonicalProductId!) ?? []), record]));
  for (const [productId, duplicates] of byProductId) if (duplicates.length > 1) duplicates.forEach(record => add(record, "DUPLICATE_CANONICAL_PRODUCT_ID", `${productId} is used by multiple catalog entries`));
  return { valid: issues.length === 0, checked: records.length, issues: issues.sort((a, b) => String(a.catalogId).localeCompare(String(b.catalogId), "en") || a.code.localeCompare(b.code, "en")) };
};
