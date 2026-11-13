import { describe, expect, it } from "vitest";
import { canSee } from "./access";
import { hrefOf } from "./href";
import { toolPath } from "../router";
import { movedTo } from "./redirects";
import { matchRoute, routes, type RouteDef } from "./routes";

const page: RouteDef["page"] = async () => ({ default: () => null });
const table: RouteDef[] = [
  { path: "/", title: "Home", access: "everyone", page },
  { path: "/tools", title: "Tools", access: "everyone", page },
  { path: "/tools/:name", title: "Tool", access: "everyone", page },
];

describe("matchRoute", () => {
  it("finds a path, with or without a trailing slash", () => {
    expect(matchRoute("/", table)?.route.title).toBe("Home");
    expect(matchRoute("/tools/", table)?.route.title).toBe("Tools");
  });
  it("reads parameters, encoded or not", () => {
    expect(matchRoute("/tools/crm", table)?.params).toEqual({ name: "crm" });
    expect(matchRoute(hrefOf("/tools/:name", { name: "a b" }), table)?.params).toEqual({
      name: "a b",
    });
  });
  it("opens a tool on a branch, a slash in its name included (D-120)", () => {
    const real = matchRoute(toolPath("crm", "feat/x"), routes);
    expect(toolPath("crm", "feat/x")).toBe("/admin/tools/crm/tree/feat%2Fx");
    expect(real?.params).toEqual({ name: "crm", branch: "feat/x" });
    expect(matchRoute(toolPath("crm"), routes)?.params).toEqual({ name: "crm" });
  });
  it("answers undefined for anything else", () => {
    expect(matchRoute("/nope", table)).toBeUndefined();
    expect(matchRoute("/tools/a/b", table)).toBeUndefined();
    expect(matchRoute("/tools/%E0%A4%A", table)).toBeUndefined();
  });
});

describe("the route table", () => {
  it("has unique paths and unique shortcuts", () => {
    const paths = routes.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
    const keys = routes.flatMap((r) => (r.nav?.shortcut ? [r.nav.shortcut] : []));
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key).toMatch(/^[a-z]$/);
  });
  it("gives no menu item to a route with parameters", () => {
    expect(routes.filter((r) => r.path.includes(":") && r.nav)).toEqual([]);
  });
  it("puts the person's space first, then Administration, each page in one place (D-128)", () => {
    const items = (group: string) =>
      routes.filter((r) => r.nav?.group === group).map((r) => [r.path, r.nav!.label]);
    expect(items("main")).toEqual([
      ["/", "Home"],
      ["/library", "My tools"],
      ["/discover", "Discover"],
    ]);
    expect(items("admin")).toEqual([
      ["/admin/tools", "Tools"],
      ["/admin/marketplace", "Marketplace"],
      ["/admin/members", "Members"],
      ["/admin/teams", "Teams"],
      ["/admin/roles", "Roles and access"],
    ]);
    // Administration is guarded: admins only, and Tools for developers too (D-118).
    for (const route of routes.filter((r) => r.path.startsWith("/admin/"))) {
      expect(route.access === "admin" || route.access === "developer").toBe(true);
      expect(route.settings).toBeUndefined();
    }
    const titles = routes.filter((r) => r.nav || r.settings).map((r) => r.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("movedTo (D-128)", () => {
  it("sends every old address to its new place, keeping the rest of it", () => {
    expect(movedTo("/members")).toBe("/admin/members");
    expect(movedTo("/settings/members", "?invite")).toBe("/admin/members?invite");
    expect(movedTo("/settings/roles")).toBe("/admin/roles");
    expect(movedTo("/audit")).toBe("/settings/audit");
    expect(movedTo("/tools")).toBe("/admin/tools");
    expect(movedTo("/tools/crm", "?tab=access")).toBe("/admin/tools/crm?tab=access");
    expect(movedTo("/tools/crm/tree/feat%2Fx")).toBe("/admin/tools/crm/tree/feat%2Fx");
    expect(movedTo("/marketplace/official/odoo")).toBe("/admin/marketplace/official/odoo");
  });
  it("leaves alone what did not move, and never points at a missing route", () => {
    for (const path of [
      "/",
      "/library",
      "/library/crm",
      "/settings/audit",
      "/toolsx",
      "/admin/tools",
    ])
      expect(movedTo(path)).toBeUndefined();
    for (const old of [
      "/members",
      "/settings/members",
      "/settings/roles",
      "/audit",
      "/tools",
      "/marketplace",
    ]) {
      expect(matchRoute(old, routes)).toBeUndefined();
      expect(matchRoute(movedTo(old)!, routes)).toBeDefined();
    }
  });
});

describe("canSee", () => {
  const person = (roles: string[]) => ({
    id: "m",
    email: "a@b.c",
    name: "a",
    roles,
    admin: roles.includes("admin"),
  });
  it("tells everyone, member and admin; the gateway gives everyone member (D-128)", () => {
    expect(canSee("everyone", person([]))).toBe(true);
    expect(canSee("member", person([]))).toBe(false);
    expect(canSee("member", person(["developer"]))).toBe(true);
    expect(canSee("admin", person(["developer"]))).toBe(false);
    expect(canSee("admin", person(["admin"]))).toBe(true);
  });
});
