import { describe, expect, it } from "vitest";
import {
  defaultMapping,
  defaultProfile,
  grantPermissions,
  heldPermissions,
  mayAccess,
  permissionsOf,
  resolveAccess,
  workspaceRoles,
} from "./access";
import { ManifestSchema } from "./schema";
import { minimal } from "./fixtures";

// D-127: tool permissions, profiles and the mapping of workspace roles.
const tool = {
  roles: {
    manager: { label: "Manager", grants: ["read", "write"] },
    user: { label: "User", grants: ["read"] },
  },
  actions: {
    "deals.list": { access: "read" },
    "deals.move": { access: "write" },
    "deals.delete": { access: "delete" },
  },
  views: { board: { access: "write" } },
};

describe("profiles", () => {
  it("names the default profile: the one marked, else the fewest permissions, first on a tie", () => {
    expect(defaultProfile(tool.roles)).toBe("user");
    expect(defaultProfile({ ...tool.roles, manager: { grants: ["read"], default: true } })).toBe(
      "manager",
    );
    expect(defaultProfile({ a: { grants: ["read"] }, b: { grants: ["write"] } })).toBe("a");
    expect(defaultProfile({})).toBeUndefined();
  });

  it("lists every permission a tool has: its subjects' and its profiles'", () => {
    expect(permissionsOf(tool)).toEqual(["delete", "read", "write"]);
  });

  it("refuses a manifest with two default profiles", () => {
    const two = {
      ...minimal,
      roles: { a: { grants: ["read"], default: true }, b: { grants: ["read"], default: true } },
    };
    expect(ManifestSchema.safeParse(two).success).toBe(false);
    const one = { ...minimal, roles: { a: { grants: ["read"], default: true } } };
    expect(ManifestSchema.safeParse(one).success).toBe(true);
  });
});

describe("the mapping", () => {
  it("gives admin every permission and member the default profile", () => {
    expect(defaultMapping(tool.roles)).toEqual({
      admin: { kind: "all" },
      member: { kind: "profile", profile: "user" },
    });
    expect(defaultMapping({})).toEqual({ admin: { kind: "all" } });
  });

  it("resolves a grant to permissions; a profile the tool lost gives nothing", () => {
    expect(grantPermissions({ kind: "all" }, tool)).toEqual(["delete", "read", "write"]);
    expect(grantPermissions({ kind: "profile", profile: "manager" }, tool)).toEqual([
      "read",
      "write",
    ]);
    expect(grantPermissions({ kind: "profile", profile: "gone" }, tool)).toEqual([]);
    expect(grantPermissions({ kind: "custom", permissions: ["delete"] }, tool)).toEqual(["delete"]);
    expect(grantPermissions({ kind: "none" }, tool)).toEqual([]);
    expect(grantPermissions(undefined, tool)).toEqual([]);
  });

  it("resolves every subject for the person's roles, exceptions first", () => {
    const mapping = { support: { kind: "profile", profile: "user" } } as const;
    expect(
      resolveAccess(["support", "sales"], mapping, { support: { "deals.move": true } }, tool),
    ).toEqual({
      permissions: { support: ["read"], sales: [] },
      access: {
        support: {
          "deals.list": true,
          "deals.move": true,
          "deals.delete": false,
          "view:board": false,
        },
        sales: {
          "deals.list": false,
          "deals.move": false,
          "deals.delete": false,
          "view:board": false,
        },
      },
    });
  });
});

describe("mayAccess", () => {
  it("reads the permissions the gateway mapped, never the profile names, when it has them", () => {
    const who = { roles: ["user"], permissions: { user: [] } };
    expect(mayAccess(who, tool.roles, "deals.list", "read")).toBe(false);
    const support = { roles: ["support"], permissions: { support: ["read", "write"] } };
    expect(mayAccess(support, tool.roles, "deals.move", "write")).toBe(true);
    expect(mayAccess(support, tool.roles, "deals.delete", "delete")).toBe(false);
  });

  it("without the gateway, reads a role with the default mapping: profile, admin, member", () => {
    expect(mayAccess({ roles: ["manager"] }, tool.roles, "deals.move", "write")).toBe(true);
    expect(mayAccess({ roles: ["admin"] }, tool.roles, "deals.delete", "delete")).toBe(true);
    expect(mayAccess({ roles: ["member"] }, tool.roles, "deals.list", "read")).toBe(true);
    expect(mayAccess({ roles: ["member"] }, tool.roles, "deals.move", "write")).toBe(false);
    expect(mayAccess({ roles: ["stranger"] }, tool.roles, "deals.list", "read")).toBe(false);
    // A profile named `admin` is that profile, not every permission.
    const named = { admin: { grants: ["read"] } };
    expect(mayAccess({ roles: ["admin"] }, named, "deals.delete", "delete")).toBe(false);
  });

  it("lets an exception win over the mapping, either way", () => {
    const who = {
      roles: ["admin"],
      permissions: { admin: ["delete", "read", "write"] },
      access: { admin: { "deals.delete": false } },
    };
    expect(mayAccess(who, tool.roles, "deals.delete", "delete")).toBe(false);
  });

  it("says which permissions the person holds, all roles together", () => {
    expect(
      heldPermissions({ roles: ["a", "b"], permissions: { a: ["read"], b: ["write"] } }, tool),
    ).toEqual(["read", "write"]);
    expect(heldPermissions({ roles: ["admin"] }, tool)).toEqual(["delete", "read", "write"]);
    expect(heldPermissions({ roles: ["member"] }, tool)).toEqual(["read"]);
  });
});

describe("workspaceRoles (D-128)", () => {
  it("adds member to the roles a person was given, once", () => {
    expect(workspaceRoles([])).toEqual(["member"]);
    expect(workspaceRoles(["admin"])).toEqual(["admin", "member"]);
    expect(workspaceRoles(["member", "support"])).toEqual(["member", "support"]);
  });
});
