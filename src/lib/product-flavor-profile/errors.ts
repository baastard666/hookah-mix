import type { ProductFlavorProfileIssue } from "./types";

export class ProductFlavorProfileError extends Error {
  readonly issues: readonly ProductFlavorProfileIssue[];
  constructor(message: string, issues: readonly ProductFlavorProfileIssue[]) { super(message); this.name = "ProductFlavorProfileError"; this.issues = issues; }
}
