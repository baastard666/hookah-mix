import { normalizeTobaccoIdentityText } from "../tobacco-product-identity";

const slug = (value: string): string => normalizeTobaccoIdentityText(value).replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");

export const normalizeCanonicalProductName = (value: string): string =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ");

export const createResolvedCanonicalProductId = (productLineId: string, productName: string): string | null => {
  const line = slug(productLineId);
  const product = slug(productName);
  return line && product ? `${line}-${product}` : null;
};

export const createManufacturerOnlyCanonicalProductId = (manufacturerId: string, productName: string): string | null => {
  const manufacturer = slug(manufacturerId);
  const product = slug(productName);
  return manufacturer && product ? `${manufacturer}-manufacturer-only-${product}` : null;
};
