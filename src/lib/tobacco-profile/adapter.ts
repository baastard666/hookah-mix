import { resolveTobaccoProfile } from "./queries";
import type { TobaccoProfileResolution } from "./types";

export type TobaccoProfileSourceObject = {
  readonly brand: string | { readonly name: string };
  readonly productLine?: string | null;
};

export const resolveProfileForTobacco = (tobacco: TobaccoProfileSourceObject): TobaccoProfileResolution =>
  resolveTobaccoProfile({ manufacturer: typeof tobacco.brand === "string" ? tobacco.brand : tobacco.brand.name, productLine: tobacco.productLine });
