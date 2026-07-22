import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseBuilderInitialState } from "./builder-initial-state";

const ids = new Set([3, 23]);
describe("builder result handoff", () => {
  it("restores current or proposed proportions", () => expect(parseBuilderInitialState({ components: "23:75,3:25", bowl: "Cosmo Bowl Turkish", coals: "3", warmup: "5" }, ids)).toEqual({ rows: [{ flavorId: 23, percentage: 75 }, { flavorId: 3, percentage: 25 }], bowlType: "Cosmo Bowl Turkish", coalCount: 3, warmupMinutes: 5 }));
  it("rejects a total other than 100", () => expect(parseBuilderInitialState({ components: "23:75,3:20" }, ids)).toBeUndefined());
  it("rejects unknown or duplicate flavors", () => { expect(parseBuilderInitialState({ components: "23:50,99:50" }, ids)).toBeUndefined(); expect(parseBuilderInitialState({ components: "23:50,23:50" }, ids)).toBeUndefined(); });
  it("keeps result badges on one line", () => expect(readFileSync("src/app/globals.css", "utf8")).toContain("white-space:nowrap"));
});
