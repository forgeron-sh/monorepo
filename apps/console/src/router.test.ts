import { describe, expect, it } from "vitest";
import { matchRoute, pathOf, toolPath } from "./router";
import { expiry, ago } from "./format";

describe("matchRoute", () => {
  it("knows the screens, with or without a trailing slash", () => {
    expect(matchRoute("/")).toEqual({ id: "overview" });
    expect(matchRoute("/members/")).toEqual({ id: "members" });
    for (const id of ["tools", "approvals", "audit", "settings"] as const) {
      expect(matchRoute(pathOf(id))).toEqual({ id });
    }
  });
  it("reads a tool's name, encoded or not", () => {
    expect(matchRoute("/tools/crm")).toEqual({ id: "tool", tool: "crm" });
    expect(matchRoute(toolPath("a b"))).toEqual({ id: "tool", tool: "a b" });
  });
  it("answers not-found for anything else", () => {
    expect(matchRoute("/nope")).toEqual({ id: "not-found" });
    expect(matchRoute("/tools/a/b")).toEqual({ id: "not-found" });
  });
});

describe("format", () => {
  const now = new Date("2026-11-03T12:00:00Z");
  it("tells an expiry", () => {
    expect(expiry("2026-11-17T12:00:00Z", now)).toEqual({
      text: "Expires in 14 days",
      expired: false,
    });
    expect(expiry("2026-11-04T10:00:00Z", now).text).toBe("Expires today");
    expect(expiry("2026-11-04T13:00:00Z", now).text).toBe("Expires in 1 day");
    expect(expiry("2026-11-01T12:00:00Z", now)).toEqual({ text: "Expired", expired: true });
    expect(expiry("garbage", now).expired).toBe(false);
  });
  it("tells an age", () => {
    expect(ago("2026-11-03T11:59:40Z", now)).toBe("just now");
    expect(ago("2026-11-03T11:59:00Z", now)).toBe("1 minute ago");
    expect(ago("2026-11-03T09:00:00Z", now)).toBe("3 hours ago");
    expect(ago("2026-11-01T12:00:00Z", now)).toBe("2 days ago");
    expect(ago("2026-10-01T12:00:00Z", now)).toBe("2026-10-01");
  });
});
