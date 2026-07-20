const DASHES = /[‐‑‒–—―−]/g;

export const cleanTobaccoIdentityText = (value: string): string =>
  value.normalize("NFKC").replace(DASHES, "-").replace(/\s*-\s*/g, "-").trim().replace(/\s+/g, " ");

export const normalizeTobaccoIdentityText = (value: string): string =>
  cleanTobaccoIdentityText(value).toLocaleLowerCase("ru-RU");

export const slugTobaccoIdentityText = (value: string): string =>
  normalizeTobaccoIdentityText(value).replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
