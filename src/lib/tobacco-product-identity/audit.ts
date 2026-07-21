import { resolveCatalogTobaccoIdentity } from "./resolver";
import type { CatalogTobaccoAuditEntry, ResolvedTobaccoIdentity, TobaccoCatalogAuditResult, TobaccoIdentityResolution } from "./types";

const idKey = (value?: string | number) => value === undefined ? "" : String(value);
const compareCatalogIds = (a?: string | number, b?: string | number): number =>
  typeof a === "number" && typeof b === "number" ? a - b : idKey(a).localeCompare(idKey(b), "en");
const freeze = <T>(value: T): Readonly<T> => { if (value !== null && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value as Record<string, unknown>).forEach(freeze); } return value; };

export const auditTobaccoCatalogEntries = (entries: readonly CatalogTobaccoAuditEntry[]): TobaccoCatalogAuditResult => {
  const resolutions = entries.map(resolveCatalogTobaccoIdentity).sort((a, b) => compareCatalogIds(a.catalogId, b.catalogId));
  const resolved = resolutions.filter((item): item is ResolvedTobaccoIdentity => item.status === "RESOLVED");
  const groups = new Map<string, ResolvedTobaccoIdentity[]>();
  resolved.forEach(item => groups.set(item.productId, [...(groups.get(item.productId) ?? []), item]));
  const duplicateCandidates = [...groups.entries()].map(([productId, items]) => {
    const catalogIds = [...new Map(items.map(item => item.catalogId).filter((id): id is string | number => id !== undefined).map(id => [`${typeof id}:${id}`, id])).values()].sort(compareCatalogIds);
    return { productId, displayName: items[0].displayName, catalogIds };
  }).filter(candidate => candidate.catalogIds.length > 1).sort((a, b) => a.productId.localeCompare(b.productId, "en"));
  const count = (status: TobaccoIdentityResolution["status"]) => resolutions.filter(item => item.status === status).length;
  return freeze({ counters: { total: resolutions.length, resolved: count("RESOLVED"), manufacturerOnly: count("MANUFACTURER_ONLY"), productLineNotFound: count("PRODUCT_LINE_NOT_FOUND"), manufacturerNotFound: count("MANUFACTURER_NOT_FOUND"), ambiguous: count("AMBIGUOUS"), invalidInput: count("INVALID_INPUT"), duplicateCandidates: duplicateCandidates.length }, resolutions, problems: resolutions.filter(item => item.status !== "RESOLVED"), duplicateCandidates });
};
