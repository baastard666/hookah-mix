import { normalizeTobaccoName } from "./constants";
import { TOBACCO_PROFILE_REGISTRY } from "./registry";
import type { ConfidenceLevel, EvidencedValue, HeatResistance, LeafType, ManufacturerProfile, ProductLineProfile, ResolveTobaccoProfileInput, ResolvedProperty, SourceType, StrengthLevel, TobaccoProfileResolution } from "./types";

const cloneFrozen = <T>(value: T): Readonly<T> => {
  const clone = structuredClone(value);
  const freeze = (item: unknown): void => {
    if (item !== null && typeof item === "object" && !Object.isFrozen(item)) {
      Object.freeze(item);
      Object.values(item as Record<string, unknown>).forEach(freeze);
    }
  };
  freeze(clone);
  return clone;
};

const findManufacturer = (name: string): ManufacturerProfile | undefined => {
  const normalized = normalizeTobaccoName(name);
  return TOBACCO_PROFILE_REGISTRY.manufacturers.find(profile =>
    [profile.manufacturer, ...profile.aliases].some(alias => normalizeTobaccoName(alias) === normalized));
};

const findLine = (manufacturerId: string, name: string): ProductLineProfile | undefined => {
  const normalized = normalizeTobaccoName(name);
  return TOBACCO_PROFILE_REGISTRY.productLines.find(profile => profile.manufacturerId === manufacturerId &&
    [profile.productLine, ...profile.aliases].some(alias => normalizeTobaccoName(alias) === normalized));
};

export const getManufacturerProfile = (manufacturer: string): Readonly<ManufacturerProfile> | null => {
  const profile = findManufacturer(manufacturer);
  return profile ? cloneFrozen(profile) : null;
};

export const getProductLineProfile = (manufacturer: string, productLine: string): Readonly<ProductLineProfile> | null => {
  const owner = findManufacturer(manufacturer);
  const profile = owner ? findLine(owner.manufacturerId, productLine) : undefined;
  return profile ? cloneFrozen(profile) : null;
};

export const listManufacturerProfiles = (): readonly Readonly<ManufacturerProfile>[] =>
  cloneFrozen([...TOBACCO_PROFILE_REGISTRY.manufacturers].sort((a, b) => a.manufacturer.localeCompare(b.manufacturer, "ru")));

export const listProductLineProfiles = (manufacturer?: string): readonly Readonly<ProductLineProfile>[] => {
  const owner = manufacturer === undefined ? undefined : findManufacturer(manufacturer);
  if (manufacturer !== undefined && !owner) return cloneFrozen([]);
  return cloneFrozen(TOBACCO_PROFILE_REGISTRY.productLines
    .filter(profile => !owner || profile.manufacturerId === owner.manufacturerId)
    .sort((a, b) => a.productLineId.localeCompare(b.productLineId, "en")));
};

export const hasManufacturerProfile = (manufacturer: string): boolean => Boolean(findManufacturer(manufacturer));
export const hasProductLineProfile = (manufacturer: string, productLine: string): boolean => {
  const owner = findManufacturer(manufacturer);
  return Boolean(owner && findLine(owner.manufacturerId, productLine));
};

const resolveValue = <T>(manufacturer: string, productLine: string | null, own: EvidencedValue<T> | undefined, inherited: EvidencedValue<T> | undefined): ResolvedProperty<T> | null => {
  const selected = own ?? inherited;
  if (!selected) return null;
  const isInherited = Boolean(productLine && !own && inherited);
  return cloneFrozen({ ...selected, origin: own ? "PRODUCT_LINE" as const : "MANUFACTURER" as const, inherited: isInherited, inheritedFrom: isInherited ? manufacturer : null });
};

const confidenceRank: Record<ConfidenceLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
const minimumConfidence = (levels: readonly ConfidenceLevel[]): ConfidenceLevel =>
  levels.reduce((lowest, current) => confidenceRank[current] < confidenceRank[lowest] ? current : lowest, "HIGH");

export const resolveTobaccoProfile = (input: ResolveTobaccoProfileInput): TobaccoProfileResolution => {
  const manufacturer = findManufacturer(input.manufacturer);
  const requestedLine = input.productLine?.trim() || null;
  if (!manufacturer) return cloneFrozen({ status: "NOT_FOUND" as const, missing: "MANUFACTURER" as const, manufacturer: input.manufacturer.trim(), productLine: requestedLine });
  const productLine = requestedLine ? findLine(manufacturer.manufacturerId, requestedLine) : undefined;
  if (requestedLine && !productLine) return cloneFrozen({ status: "NOT_FOUND" as const, missing: "PRODUCT_LINE" as const, manufacturer: manufacturer.manufacturer, productLine: requestedLine });

  const strengthLevel = resolveValue<StrengthLevel>(manufacturer.manufacturer, productLine?.productLine ?? null, productLine?.strengthLevel, manufacturer.strengthLevel);
  const heatResistance = resolveValue<HeatResistance>(manufacturer.manufacturer, productLine?.productLine ?? null, productLine?.heatResistance, manufacturer.heatResistance);
  const leafTypes = resolveValue<readonly LeafType[]>(manufacturer.manufacturer, productLine?.productLine ?? null, productLine?.leafTypes, manufacturer.leafTypes);
  const properties = [strengthLevel, heatResistance, leafTypes].filter((item): item is NonNullable<typeof item> => item !== null);
  const sourceTypes = [...new Set<SourceType>([...manufacturer.sourceTypes, ...(productLine?.sourceTypes ?? []), ...properties.flatMap(item => item.evidence.map(evidence => evidence.sourceType))])];
  return cloneFrozen({ status: "FOUND" as const, manufacturer: manufacturer.manufacturer, productLine: productLine?.productLine ?? null, strengthLevel, heatResistance, leafTypes, dataConfidence: minimumConfidence([manufacturer.dataConfidence, ...(productLine ? [productLine.dataConfidence] : []), ...properties.map(item => item.confidence)]), sourceTypes, notes: [...manufacturer.notes, ...(productLine?.notes ?? [])] });
};
