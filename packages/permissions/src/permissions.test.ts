import { describe, expect, it } from "vitest";
import {
  ALL,
  BUILT_IN_TEAMS,
  EVERYONE,
  PLATFORM,
  PLATFORM_GROUPS,
  PLATFORM_PERMISSIONS,
  defineCatalog,
  expand,
  holds,
  isSubject,
  isTeamId,
  minimal,
  missingToGrant,
  permissionsOfSubjects,
  platformPermissions,
  subjectsOf,
  teamOf,
  teamSubject,
} from "./index";

describe("subjects", () => {
  it("gives a person everyone, then one subject per team, once and sorted", () => {
    expect(subjectsOf(["sales", "admin", "sales"])).toEqual([EVERYONE, "team:admin", "team:sales"]);
    expect(subjectsOf([])).toEqual([EVERYONE]);
  });

  it("reads a team back from its subject, and nothing else", () => {
    expect(teamOf(teamSubject("product"))).toBe("product");
    expect(teamOf(EVERYONE)).toBeUndefined();
    expect(teamOf("team:Bad")).toBeUndefined();
    expect(isSubject("team:product")).toBe(true);
    expect(isSubject("admin")).toBe(false);
  });

  it("keeps `everyone` from being a team id", () => {
    expect(isTeamId("everyone")).toBe(false);
    expect(isTeamId("support")).toBe(true);
    expect(isTeamId("a")).toBe(false);
  });
});

describe("the engine", () => {
  const catalog = defineCatalog({
    "x:read": { label: "r", description: "r" },
    "x:write": { label: "w", description: "w", implies: ["x:read"] },
    "x:own": { label: "o", description: "o", implies: ["x:write"] },
  });

  it("refuses a catalog that implies an unknown permission", () => {
    expect(() =>
      defineCatalog({ a: { label: "a", description: "a", implies: ["b" as never] } }),
    ).toThrow(/unknown/);
  });

  it("follows implications, and `*` gives everything", () => {
    expect([...expand(catalog, ["x:own"])].sort()).toEqual(["x:own", "x:read", "x:write"]);
    expect(expand(catalog, [ALL]).size).toBe(3);
    expect(expand(catalog, ["gone"]).size).toBe(0);
    expect(holds(catalog, ["x:write"], "x:read")).toBe(true);
    expect(holds(catalog, ["x:read"], "x:write")).toBe(false);
  });

  it("unions what each subject of a person is given", () => {
    const held = permissionsOfSubjects(catalog, ["everyone", "team:a"], {
      everyone: ["x:read"],
      "team:a": ["x:write"],
      "team:b": ["x:own"],
    });
    expect([...held].sort()).toEqual(["x:read", "x:write"]);
  });

  it("refuses to give what one does not hold", () => {
    expect(missingToGrant(catalog, ["x:write"], ["x:read"])).toEqual([]);
    expect(missingToGrant(catalog, ["x:write"], ["x:own"])).toEqual(["x:own"]);
    expect(missingToGrant(catalog, [ALL], ["x:own"])).toEqual([]);
  });

  it("stores the fewest grants", () => {
    expect(minimal(catalog, ["x:read", "x:write"])).toEqual(["x:write"]);
    expect(minimal(catalog, ["x:read", ALL])).toEqual([ALL]);
  });
});

describe("the platform catalog", () => {
  it("shows every permission in exactly one group", () => {
    const grouped = PLATFORM_GROUPS.flatMap((g) => g.permissions);
    expect([...grouped].sort()).toEqual([...PLATFORM_PERMISSIONS].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it("gives the admin team every permission, and developers what builds tools", () => {
    const grants = Object.fromEntries(BUILT_IN_TEAMS.map((t) => [t.id, t.permissions]));
    expect(platformPermissions(["admin"], grants)).toEqual(PLATFORM_PERMISSIONS);
    const developer = platformPermissions(["developer"], grants);
    expect(developer).toContain("tools:write");
    expect(developer).toContain("tools:read");
    expect(developer).not.toContain("members:write");
    expect(developer).not.toContain("tools:delete");
    expect(platformPermissions(["nobody"], grants)).toEqual([]);
  });

  it("lets a person update the platform with settings:read, in Operations, and admins through *", () => {
    expect(holds(PLATFORM, ["platform:update"], "settings:read")).toBe(true);
    expect(holds(PLATFORM, ["platform:update"], "settings:write")).toBe(false);
    expect(holds(PLATFORM, ["settings:write"], "platform:update")).toBe(false);
    expect(PLATFORM_GROUPS.find((g) => g.label === "Operations")?.permissions).toContain(
      "platform:update",
    );
    expect(PLATFORM.permissions["platform:update"].label).toBe("Update Forgeron");
    const grants = Object.fromEntries(BUILT_IN_TEAMS.map((t) => [t.id, t.permissions]));
    expect(platformPermissions(["admin"], grants)).toContain("platform:update");
    expect(platformPermissions(["developer"], grants)).not.toContain("platform:update");
    expect(minimal(PLATFORM, ["settings:read", "platform:update"])).toEqual(["platform:update"]);
  });

  it("makes every write imply its read", () => {
    const pairs = PLATFORM_PERMISSIONS.filter((p) => p.endsWith(":write"))
      .map((p) => [p, p.replace(/:write$/, ":read")] as const)
      .filter(([, read]) => read in PLATFORM.permissions);
    expect(pairs.length).toBeGreaterThan(0);
    for (const [write, read] of pairs) expect(holds(PLATFORM, [write], read as never)).toBe(true);
  });
});
