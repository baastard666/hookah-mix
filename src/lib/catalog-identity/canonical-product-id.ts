import { createAsciiCanonicalSlug } from "../tobacco-canonical-id";

export const normalizeCanonicalProductName = (value: string): string =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ");

export const createResolvedCanonicalProductId = (productLineId: string, productName: string): string | null => {
  const line = createAsciiCanonicalSlug(productLineId);
  const product = createAsciiCanonicalSlug(productName);
  return line && product ? `${line}-${product}` : null;
};

export const createManufacturerOnlyCanonicalProductId = (manufacturerId: string, productName: string): string | null => {
  const manufacturer = createAsciiCanonicalSlug(manufacturerId);
  const product = createAsciiCanonicalSlug(productName);
  return manufacturer && product ? `${manufacturer}-manufacturer-only-${product}` : null;
};
