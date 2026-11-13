import { describe, expect, it } from "vitest";
import {
  defaultGrants,
  defaultProfile,
  grantPermissions,
  heldPermissions,
  mayAccess,
  permissionsOf,
  resolveAccess,
} from "./access";
import { ManifestSchema } from "./schema";
import { minimal } from "./fixtures";

// D-127, D-137: tool permissions, profiles and the grants of subjects.
const tool = {
  profiles: {
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
    expect(defaultProfile(tool.profiles)).toBe("user");
    expect(defaultProfile({ ...tool.profiles, manager: { grants: ["read"], default: true } })).toBe(
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
      profiles: { a: { grants: ["read"], default: true }, b: { grants: ["read"], default: true } },
    };
    expect(ManifestSchema.safeParse(two).success).toBe(false);
    const one = { ...minimal, profiles: { a: { grants: ["read"], default: true } } };
    expect(ManifestSchema.safeParse(one).success).toBe(true);
  });
});

describe("the grants", () => {
  it("gives the admin team every permission and everyone the default profile", () => {
    expect(defaultGrants(tool.profiles)).toEqual({
      "team:admin": { kind: "all" },
      everyone: { kind: "profile", profile: "user" },
    });
    expect(defaultGrants({})).toEqual({ "team:admin": { kind: "all" } });
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

  it("resolves every action for the person's subjects, exceptions first", () => {
    const grants = { "team:support": { kind: "profile", profile: "user" } } as const;
    expect(
      resolveAccess(
        ["team:support", "team:sales"],
        grants,
        { "team:support": { "deals.move": true } },
        tool,
      ),
    ).toEqual({
      permissions: { "team:support": ["read"], "team:sales": [] },
      access: {
        "team:support": {
          "deals.list": true,
          "deals.move": true,
          "deals.delete": false,
          "view:board": false,
        },
        "team:sales": {
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
  it("reads the permissions the gateway gave, never the profile names, when it has them", () => {
    const who = { subjects: ["everyone"], permissions: { everyone: [] } };
    expect(mayAccess(who, tool.profiles, "deals.list", "read")).toBe(false);
    const support = {
      subjects: ["everyone", "team:support"],
      permissions: { everyone: [], "team:support": ["read", "write"] },
    };
    expect(mayAccess(support, tool.profiles, "deals.move", "write")).toBe(true);
    expect(mayAccess(support, tool.profiles, "deals.delete", "delete")).toBe(false);
  });

  it("without the gateway, reads a subject with the default grants: admin team, everyone", () => {
    expect(mayAccess({ subjects: ["team:admin"] }, tool.profiles, "deals.delete", "delete")).toBe(
      true,
    );
    expect(mayAccess({ subjects: ["everyone"] }, tool.profiles, "deals.list", "read")).toBe(true);
    expect(mayAccess({ subjects: ["everyone"] }, tool.profiles, "deals.move", "write")).toBe(false);
    expect(mayAccess({ subjects: ["team:sales"] }, tool.profiles, "deals.list", "read")).toBe(
      false,
    );
    // A team named like a profile is a team, not that profile.
    expect(mayAccess({ subjects: ["team:manager"] }, tool.profiles, "deals.move", "write")).toBe(
      false,
    );
  });

  it("lets an exception win over the grants, either way", () => {
    const who = {
      subjects: ["team:admin"],
      permissions: { "team:admin": ["delete", "read", "write"] },
      access: { "team:admin": { "deals.delete": false } },
    };
    expect(mayAccess(who, tool.profiles, "deals.delete", "delete")).toBe(false);
  });

  it("says which permissions the person holds, all subjects together", () => {
    expect(
      heldPermissions(
        {
          subjects: ["team:a", "team:b"],
          permissions: { "team:a": ["read"], "team:b": ["write"] },
        },
        tool,
      ),
    ).toEqual(["read", "write"]);
    expect(heldPermissions({ subjects: ["team:admin"] }, tool)).toEqual([
      "delete",
      "read",
      "write",
    ]);
    expect(heldPermissions({ subjects: ["everyone"] }, tool)).toEqual(["read"]);
  });
});
