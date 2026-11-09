export class VerifiedMixAnalysisError extends Error {
  constructor(message: string, readonly code: "CANONICAL_IDENTITY_NOT_RESOLVED" | "INVALID_PRODUCT_PROFILE" | "INVALID_RECIPE_ANALYSIS") {
    super(message);
    this.name = "VerifiedMixAnalysisError";
  }
}
