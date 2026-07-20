import { resolveCatalogTobaccoIdentity } from "../tobacco-product-identity";
import type { CatalogIdentityCoverageResult, CatalogIdentityRecord } from "./types";

const uniqueSorted = (items: readonly string[]): readonly string[] => [...new Set(items)].sort((a, b) => a.localeCompare(b, "ru"));

export const calculateCatalogIdentityCoverage = (records: readonly CatalogIdentityRecord[]): CatalogIdentityCoverageResult => {
  const real = records.filter(record => record.catalogEntryType === "REAL");
  const resolutions = real.map(record => ({ record, resolution: resolveCatalogTobaccoIdentity({ catalogId: record.catalogId, brand: record.brand, name: record.name }) }));
  return {
    realCatalogEntries: real.length,
    testCatalogEntries: records.filter(record => record.catalogEntryType === "TEST").length,
    resolved: real.filter(record => record.identityStatus === "RESOLVED").length,
    manufacturerOnly: real.filter(record => record.identityStatus === "MANUFACTURER_ONLY").length,
    unresolved: real.filter(record => record.identityStatus === "UNRESOLVED" || record.identityStatus === "AMBIGUOUS" || record.identityStatus === "INVALID").length,
    verified: real.filter(record => record.identityVerified).length,
    unverified: real.filter(record => !record.identityVerified).length,
    missingManufacturers: uniqueSorted(resolutions.filter(item => item.resolution.status === "MANUFACTURER_NOT_FOUND").map(item => item.record.brand)),
    missingProductLines: uniqueSorted(resolutions.filter(item => item.resolution.status === "MANUFACTURER_ONLY" || item.resolution.status === "PRODUCT_LINE_NOT_FOUND").map(item => item.record.brand)),
  };
};
