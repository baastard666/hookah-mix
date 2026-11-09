import type { VerifiedMixRecipeValidationIssue } from "./types";

export class VerifiedMixRecipeRegistryError extends Error {
  readonly issues: readonly VerifiedMixRecipeValidationIssue[];

  constructor(message: string, issues: readonly VerifiedMixRecipeValidationIssue[]) {
    super(message);
    this.name = "VerifiedMixRecipeRegistryError";
    this.issues = issues;
  }
}
