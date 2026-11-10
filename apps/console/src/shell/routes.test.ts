import { describe, expect, it } from "vitest";
import { canSee } from "./access";
import { hrefOf } from "./href";
import { toolPath } from "../router";
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
    expect(toolPath("crm", "feat/x")).toBe("/tools/crm/tree/feat%2Fx");
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
});

describe("canSee", () => {
  const person = (roles: string[]) => ({
    id: "m",
    email: "a@b.c",
    name: "a",
    roles,
    admin: roles.includes("admin"),
  });
  it("tells everyone, member and admin", () => {
    expect(canSee("everyone", person([]))).toBe(true);
    expect(canSee("member", person([]))).toBe(false);
    expect(canSee("member", person(["developer"]))).toBe(true);
    expect(canSee("admin", person(["developer"]))).toBe(false);
    expect(canSee("admin", person(["admin"]))).toBe(true);
  });
});
