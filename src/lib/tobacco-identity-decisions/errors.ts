import type { TobaccoIdentityDecisionIssue } from "./types";

export class TobaccoIdentityDecisionError extends Error {
  readonly issues: readonly TobaccoIdentityDecisionIssue[];
  constructor(message: string, issues: readonly TobaccoIdentityDecisionIssue[]) { super(message); this.name = "TobaccoIdentityDecisionError"; this.issues = issues; }
}
