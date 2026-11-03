import { describe, expect, it } from "vitest";
import { diffResourceChanges } from "./diff";

describe("diffResourceChanges", () => {
  it("flags what is added or broadened, not what is removed", () => {
    const changes = diffResourceChanges(
      { cache: {}, network: { allow: ["a.test"], why: "x" } },
      { network: { allow: ["a.test", "b.test"], why: "x" }, queue: {} },
    );
    const byKind = Object.fromEntries(changes.map((c) => [c.kind, c.needsApproval === true]));
    expect(byKind["resource.broadened"]).toBe(true);
    expect(byKind["resource.added"]).toBe(true);
    expect(byKind["resource.removed"]).toBe(false);
  });

  it("is empty when nothing changes", () => {
    expect(diffResourceChanges({ cache: {} }, { cache: {} })).toEqual([]);
  });
});
