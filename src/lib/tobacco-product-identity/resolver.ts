import { listManufacturerProfiles, listProductLineProfiles } from "../tobacco-profile";
import type { ManufacturerProfile, ProductLineProfile } from "../tobacco-profile";
import { cleanTobaccoIdentityText, normalizeTobaccoIdentityText, slugTobaccoIdentityText } from "./normalizer";
import type { CatalogTobaccoIdentityInput, NormalizedTobaccoIdentityInput, TobaccoIdentityMatchType, TobaccoIdentityResolution, TobaccoIdentityWarningCode } from "./types";

type IdentityDirectory = {
  readonly manufacturers: readonly Readonly<ManufacturerProfile>[];
  readonly productLines: readonly Readonly<ProductLineProfile>[];
};
const defaultDirectory = (): IdentityDirectory => ({ manufacturers: listManufacturerProfiles(), productLines: listProductLineProfiles() });
const normalized = (value?: string | null): string | null => value?.trim() ? normalizeTobaccoIdentityText(value) : null;
const clean = (value?: string | null): string | null => value?.trim() ? cleanTobaccoIdentityText(value) : null;
const withCatalogId = (input: CatalogTobaccoIdentityInput) => input.catalogId === null || input.catalogId === undefined ? {} : { catalogId: input.catalogId };

const aliasesForManufacturer = (profile: Readonly<ManufacturerProfile>) => [profile.manufacturer, ...profile.aliases];
const aliasesForLine = (profile: Readonly<ProductLineProfile>) => [profile.productLine, ...profile.aliases];
const boundaryPrefix = (text: string, prefix: string): boolean => text === prefix || text.startsWith(`${prefix} `) || text.startsWith(`${prefix}-`);
const removePrefix = (text: string, prefix: string): string => cleanTobaccoIdentityText(text.slice(prefix.length).replace(/^[\s-]+/, ""));

const exactManufacturer = (brand: string, directory: IdentityDirectory) => directory.manufacturers.filter(profile => aliasesForManufacturer(profile).some(alias => normalizeTobaccoIdentityText(alias) === normalizeTobaccoIdentityText(brand)));
const manufacturerPrefixes = (name: string, directory: IdentityDirectory) => directory.manufacturers.flatMap(profile => aliasesForManufacturer(profile).filter(alias => boundaryPrefix(normalizeTobaccoIdentityText(name), normalizeTobaccoIdentityText(alias))).map(alias => ({ profile, alias: cleanTobaccoIdentityText(alias) })));
const linePrefixes = (name: string, manufacturerId: string, directory: IdentityDirectory) => directory.productLines.filter(line => line.manufacturerId === manufacturerId).flatMap(profile => aliasesForLine(profile).filter(alias => boundaryPrefix(normalizeTobaccoIdentityText(name), normalizeTobaccoIdentityText(alias))).map(alias => ({ profile, alias: cleanTobaccoIdentityText(alias) })));
const selectLongest = <T extends { alias: string }>(matches: readonly T[]): readonly T[] => {
  const max = Math.max(0, ...matches.map(match => normalizeTobaccoIdentityText(match.alias).length));
  return matches.filter(match => normalizeTobaccoIdentityText(match.alias).length === max);
};
const uniqueProfiles = <T extends { profile: { manufacturerId?: string; productLineId?: string } }>(matches: readonly T[]) => [...new Map(matches.map(match => [match.profile.productLineId ?? match.profile.manufacturerId, match])).values()];

export const resolveCatalogTobaccoIdentityWithDirectory = (input: CatalogTobaccoIdentityInput, directory: IdentityDirectory): TobaccoIdentityResolution => {
  const normalizedInput: NormalizedTobaccoIdentityInput = { brand: normalized(input.brand), productLine: normalized(input.productLine), name: normalized(input.name) };
  const originalInput: CatalogTobaccoIdentityInput = { ...withCatalogId(input), brand: input.brand ?? null, productLine: input.productLine ?? null, name: input.name ?? null };
  const base = { ...withCatalogId(input), originalInput, normalizedInput, warnings: [] as readonly TobaccoIdentityWarningCode[], candidates: [] as readonly string[] };
  const rawName = clean(input.name);
  if (!normalizedInput.brand && !rawName) return { ...base, status: "INVALID_INPUT", reasonCodes: ["EMPTY_BRAND_AND_NAME"] };

  let manufacturerMatchType: TobaccoIdentityMatchType = "EXACT_CANONICAL";
  let manufacturerMatches = input.brand?.trim() ? exactManufacturer(input.brand, directory) : [];
  let manufacturerPrefix: string | null = null;
  if (input.brand?.trim()) {
    if (!manufacturerMatches.length) return { ...base, status: "MANUFACTURER_NOT_FOUND", reasonCodes: ["UNKNOWN_MANUFACTURER"] };
    if (manufacturerMatches.length > 1) return { ...base, status: "AMBIGUOUS", reasonCodes: ["MULTIPLE_PRODUCT_LINE_MATCHES"], candidates: manufacturerMatches.map(item => item.manufacturer).sort() };
    manufacturerMatchType = normalizeTobaccoIdentityText(input.brand) === normalizeTobaccoIdentityText(manufacturerMatches[0].manufacturer) ? "EXACT_CANONICAL" : "EXACT_ALIAS";
  } else if (rawName) {
    const prefixMatches = uniqueProfiles(selectLongest(manufacturerPrefixes(rawName, directory)));
    if (prefixMatches.length > 1) return { ...base, status: "AMBIGUOUS", reasonCodes: ["MULTIPLE_PRODUCT_LINE_MATCHES"], candidates: prefixMatches.map(item => item.profile.manufacturer).sort() };
    if (!prefixMatches.length) return { ...base, status: "MANUFACTURER_NOT_FOUND", reasonCodes: ["UNKNOWN_MANUFACTURER"] };
    manufacturerMatches = [prefixMatches[0].profile]; manufacturerPrefix = prefixMatches[0].alias; manufacturerMatchType = "CONTROLLED_NAME_PREFIX";
  }
  const manufacturer = manufacturerMatches[0];
  if (!manufacturer) return { ...base, status: "MANUFACTURER_NOT_FOUND", reasonCodes: ["UNKNOWN_MANUFACTURER"] };

  let productText = rawName ?? "";
  const explicitManufacturerPrefix = rawName ? selectLongest(manufacturerPrefixes(rawName, { manufacturers: [manufacturer], productLines: directory.productLines }))[0]?.alias : undefined;
  if (manufacturerPrefix ?? explicitManufacturerPrefix) productText = removePrefix(productText, (manufacturerPrefix ?? explicitManufacturerPrefix)!);
  const parsedMatches = uniqueProfiles(selectLongest(linePrefixes(productText, manufacturer.manufacturerId, directory)));
  if (parsedMatches.length > 1) return { ...base, status: "AMBIGUOUS", reasonCodes: ["MULTIPLE_PRODUCT_LINE_MATCHES"], candidates: parsedMatches.map(item => item.profile.productLine).sort() };
  const parsed = parsedMatches[0];

  let line: Readonly<ProductLineProfile> | null = null;
  let matchType: TobaccoIdentityMatchType = manufacturerMatchType;
  const warnings: TobaccoIdentityWarningCode[] = [];
  if (input.productLine?.trim()) {
    line = directory.productLines.find(item => item.manufacturerId === manufacturer.manufacturerId && aliasesForLine(item).some(alias => normalizeTobaccoIdentityText(alias) === normalizeTobaccoIdentityText(input.productLine!))) ?? null;
    if (!line) return { ...base, status: "PRODUCT_LINE_NOT_FOUND", reasonCodes: ["UNKNOWN_EXPLICIT_PRODUCT_LINE"] };
    matchType = "EXPLICIT_FIELDS";
    if (parsed && parsed.profile.productLineId !== line.productLineId) warnings.push("EXPLICIT_PRODUCT_LINE_CONFLICTS_WITH_NAME_PREFIX");
  } else if (parsed) {
    line = parsed.profile; matchType = "CONTROLLED_NAME_PREFIX";
  }

  if (!line) return { ...base, status: "MANUFACTURER_ONLY", manufacturerId: manufacturer.manufacturerId, manufacturer: manufacturer.manufacturer, productName: productText || null, matchType: "MANUFACTURER_FALLBACK", confidence: manufacturerMatchType === "EXACT_CANONICAL" ? "MEDIUM" : "LOW", reasonCodes: ["PRODUCT_LINE_NOT_DETECTED"] };
  const prefixToStrip = parsed?.alias ?? selectLongest(linePrefixes(productText, manufacturer.manufacturerId, { manufacturers: directory.manufacturers, productLines: [line] }))[0]?.alias;
  const productName = prefixToStrip ? removePrefix(productText, prefixToStrip) : cleanTobaccoIdentityText(productText);
  if (!productName) return { ...base, warnings, status: "INVALID_INPUT", reasonCodes: ["EMPTY_PRODUCT_NAME"] };
  const productSlug = slugTobaccoIdentityText(productName);
  if (!productSlug) return { ...base, warnings, status: "INVALID_INPUT", reasonCodes: ["EMPTY_PRODUCT_NAME"] };
  return { ...base, warnings, status: "RESOLVED", manufacturerId: manufacturer.manufacturerId, manufacturer: manufacturer.manufacturer, productLineId: line.productLineId, productLine: line.productLine, productName, displayName: `${manufacturer.manufacturer} ${line.productLine} ${productName}`, productId: `${line.productLineId}-${productSlug}`, matchType, confidence: matchType === "EXPLICIT_FIELDS" ? "HIGH" : "MEDIUM", reasonCodes: [] };
};

const DEFAULT_DIRECTORY = defaultDirectory();
export const resolveCatalogTobaccoIdentity = (input: CatalogTobaccoIdentityInput): TobaccoIdentityResolution =>
  resolveCatalogTobaccoIdentityWithDirectory(input, DEFAULT_DIRECTORY);
