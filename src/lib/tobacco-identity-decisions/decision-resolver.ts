import { resolveCatalogTobaccoIdentity } from "../tobacco-product-identity";
import { validateTobaccoIdentityDecision } from "./decision-validator";
import type { TobaccoIdentityDecisionRegistry } from "./types";

export type DecisionAwareIdentityResolution =
  | { readonly source: "DECISION"; readonly status: "RESOLVED"; readonly manufacturerId: string; readonly productLineId: string | null; readonly canonicalProductId: string; readonly canonicalProductName: string }
  | { readonly source: "DECISION"; readonly status: "MANUFACTURER_ONLY"; readonly manufacturerId: string }
  | { readonly source: "DECISION"; readonly status: "UNRESOLVED" | "AMBIGUOUS" | "REJECTED" }
  | { readonly source: "EXISTING_RESOLVER"; readonly resolution: ReturnType<typeof resolveCatalogTobaccoIdentity> };
export const resolveIdentityWithDecisions = (input: { readonly manufacturer: string | null; readonly productLine: string | null; readonly productName: string | null }, registry: TobaccoIdentityDecisionRegistry): DecisionAwareIdentityResolution => {
  const lookup = registry.getBySourceIdentity(input.manufacturer, input.productLine, input.productName);
  if (lookup.status === "FOUND" && validateTobaccoIdentityDecision(lookup.decision).applicable) {
    const decision = lookup.decision.decision;
    if (decision.status === "RESOLVED" && decision.manufacturerId && decision.canonicalProductId && decision.canonicalProductName) return { source: "DECISION", status: "RESOLVED", manufacturerId: decision.manufacturerId, productLineId: decision.productLineId, canonicalProductId: decision.canonicalProductId, canonicalProductName: decision.canonicalProductName };
    if (decision.status === "MANUFACTURER_ONLY" && decision.manufacturerId) return { source: "DECISION", status: "MANUFACTURER_ONLY", manufacturerId: decision.manufacturerId };
    if (decision.status === "UNRESOLVED" || decision.status === "AMBIGUOUS" || decision.status === "REJECTED") return { source: "DECISION", status: decision.status };
  }
  return { source: "EXISTING_RESOLVER", resolution: resolveCatalogTobaccoIdentity({ brand: input.manufacturer, productLine: input.productLine, name: input.productName }) };
};
