import { describe, expect, it } from "vitest";
import { registerToolTab, toolTabs } from "./tabs";

const load = async () => ({ default: () => null });
const person = (...permissions: Parameters<typeof toolTabs>[0]["permissions"]) => ({
  id: "m1",
  email: "a@b.c",
  name: "a",
  teams: [],
  permissions,
});

describe("tool tabs", () => {
  it("lists tabs in order, and hides the ones whose permission the person does not hold", () => {
    registerToolTab({
      id: "secrets",
      title: "Secrets",
      scope: "tool",
      requires: "tools:secrets",
      load,
    });
    registerToolTab({
      id: "overview",
      title: "Overview",
      scope: "tool",
      requires: "signed-in",
      order: 0,
      load,
    });
    registerToolTab({
      id: "access",
      title: "Access",
      scope: "tool",
      requires: "access:read",
      order: 50,
      load,
    });
    expect(toolTabs(person("tools:secrets", "access:read")).map((t) => t.id)).toEqual([
      "overview",
      "access",
      "secrets",
    ]);
    expect(toolTabs(person("access:write")).map((t) => t.id)).toEqual(["overview", "access"]);
    expect(toolTabs(person()).map((t) => t.id)).toEqual(["overview"]);
  });
  it("replaces a tab registered twice", () => {
    registerToolTab({
      id: "overview",
      title: "About",
      scope: "tool",
      requires: "signed-in",
      order: 0,
      load,
    });
    expect(toolTabs(person()).filter((t) => t.id === "overview")).toHaveLength(1);
    expect(toolTabs(person())[0]!.title).toBe("About");
  });
});
