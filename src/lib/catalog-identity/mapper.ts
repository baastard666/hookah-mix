import type { TobaccoIdentityResolution } from "../tobacco-product-identity";
import { createManufacturerOnlyCanonicalProductId } from "./canonical-product-id";
import type { CatalogEntryType, CatalogIdentityProposal, PersistedCatalogIdentity } from "./types";

export type MapIdentityResolutionOptions = { readonly identityVerified?: boolean; readonly catalogEntryType?: CatalogEntryType };

export const mapIdentityResolutionToPersistedIdentity = (resolution: TobaccoIdentityResolution, options: MapIdentityResolutionOptions = {}): CatalogIdentityProposal => {
  const common = { identityVerified: options.identityVerified ?? false, catalogEntryType: options.catalogEntryType ?? "REAL" as const };
  let identity: PersistedCatalogIdentity;
  switch (resolution.status) {
    case "RESOLVED":
      identity = { manufacturerId: resolution.manufacturerId, productLineId: resolution.productLineId, canonicalProductName: resolution.productName, canonicalProductId: resolution.productId, identityStatus: "RESOLVED", ...common };
      break;
    case "MANUFACTURER_ONLY": {
      const productId = resolution.productName ? createManufacturerOnlyCanonicalProductId(resolution.manufacturerId, resolution.productName) : null;
      identity = { manufacturerId: resolution.manufacturerId, productLineId: null, canonicalProductName: resolution.productName, canonicalProductId: productId, identityStatus: productId ? "MANUFACTURER_ONLY" : "INVALID", ...common };
      break;
    }
    case "AMBIGUOUS":
      identity = { manufacturerId: null, productLineId: null, canonicalProductName: resolution.normalizedInput.name, canonicalProductId: null, identityStatus: "AMBIGUOUS", ...common };
      break;
    case "INVALID_INPUT":
      identity = { manufacturerId: null, productLineId: null, canonicalProductName: resolution.normalizedInput.name, canonicalProductId: null, identityStatus: "INVALID", ...common };
      break;
    default:
      identity = { manufacturerId: null, productLineId: null, canonicalProductName: resolution.normalizedInput.name, canonicalProductId: null, identityStatus: "UNRESOLVED", ...common };
  }
  return { identity, resolutionStatus: resolution.status, reasonCodes: resolution.reasonCodes, warnings: resolution.warnings };
};
