export const ASCII_CANONICAL_PRODUCT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const RUSSIAN_TRANSLITERATION: Readonly<Record<string, string>> = Object.freeze({
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
});

export const transliterateRussianText = (value: string): string => [...value.toLowerCase()]
  .map(character => RUSSIAN_TRANSLITERATION[character] ?? character)
  .join("");

export const createAsciiCanonicalSlug = (value: string): string => transliterateRussianText(value)
  .normalize("NFKD")
  .replace(/\p{M}+/gu, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/-+/g, "-")
  .replace(/^-+|-+$/g, "");

export const selectCanonicalProductSlug = (input: {
  readonly canonicalDisplayName: string;
  readonly officialEnglishCanonicalName?: string | null;
}): string => createAsciiCanonicalSlug(input.officialEnglishCanonicalName?.trim() || input.canonicalDisplayName);

export const createAsciiCanonicalTobaccoProductId = (
  manufacturerId: string,
  productLineId: string | null,
  canonicalDisplayName: string,
  officialEnglishCanonicalName?: string | null,
): string | null => {
  const manufacturer = createAsciiCanonicalSlug(manufacturerId);
  const rawLine = productLineId ? createAsciiCanonicalSlug(productLineId) : "";
  const line = rawLine.startsWith(`${manufacturer}-`) ? rawLine.slice(manufacturer.length + 1) : rawLine;
  const product = selectCanonicalProductSlug({ canonicalDisplayName, officialEnglishCanonicalName });
  if (!manufacturer || !product || (productLineId !== null && !line)) return null;
  const canonicalProductId = [manufacturer, line, product].filter(Boolean).join("-");
  return ASCII_CANONICAL_PRODUCT_ID_PATTERN.test(canonicalProductId) ? canonicalProductId : null;
};
