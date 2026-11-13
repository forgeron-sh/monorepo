import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ConsolePerson } from "./app";
import { ADMIN, describeRouteMatrix, holding, MEMBER } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The common answers of the teams routes (D-132, D-137), then what they do: who holds `teams:write` creates,
// renames and deletes, within what they hold; anyone signed in reads.

let memory: MemoryD1;
let registry: Registry;
let person: ConsolePerson | undefined;
let call: (request: Request) => Promise<Response | undefined>;
let memberId: string;

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  memberId = (
    await registry.addMember({
      workspace: "acme",
      subject: "s1",
      email: "ada@acme.test",
      name: "Ada",
      teams: [],
    })
  ).id;
  call = platformCaller({ registry, who: () => person, installDomains: ["acme.test"] });
});
afterAll(() => memory.close());

const through = async (request: Request, who: ConsolePerson | undefined) => {
  person = who;
  return (await call(request))!;
};

describeRouteMatrix({
  title: "GET /api/teams",
  access: "signed-in",
  call: through,
  method: "GET",
  path: "/api/teams",
});
describeRouteMatrix({
  title: "GET /api/permissions",
  access: "signed-in",
  call: through,
  method: "GET",
  path: "/api/permissions",
});
describeRouteMatrix({
  title: "POST /api/teams",
  access: "teams:write",
  call: through,
  method: "POST",
  path: "/api/teams",
  invalidMessage: "Invalid input.",
  valid: { id: "ops", name: "Operations" },
  invalid: [
    {},
    { id: "Bad Slug", name: "x" },
    { id: "ok", name: "" },
    { id: "ok", name: "x", members: "all" },
  ],
});
describeRouteMatrix({
  title: "PATCH /api/teams/<id>",
  access: "teams:write",
  call: through,
  method: "PATCH",
  path: "/api/teams/ops",
  valid: { name: "Ops" },
  invalid: [{ name: "" }, { members: "all" }],
});
describeRouteMatrix({
  title: "DELETE /api/teams/<id>",
  access: "teams:write",
  call: through,
  method: "DELETE",
  path: "/api/teams/ghost",
});

const send = (who: ConsolePerson, method: string, path: string, body?: unknown) =>
  through(
    new Request(`https://acme.forgeron.test${path}`, {
      method,
      ...(body
        ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
        : {}),
    }),
    who,
  );

describe("teams", () => {
  it("are created and changed by who holds `teams:write`, and read by anyone signed in", async () => {
    const created = await send(ADMIN, "POST", "/api/teams", {
      id: "design",
      name: "Design",
      members: [memberId],
      permissions: ["tools:write", "tools:read"],
    });
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({
      id: "design",
      members: [memberId],
      builtIn: false,
      locked: false,
      permissions: ["tools:write"],
      effective: ["tools:read", "tools:write"],
    });
    const read = await send(MEMBER, "GET", "/api/teams");
    const teams = ((await read.json()) as { teams: Array<{ id: string; builtIn: boolean }> }).teams;
    expect(teams.map((t) => t.id)).toEqual(
      expect.arrayContaining(["admin", "developer", "design"]),
    );
    expect(teams.find((t) => t.id === "admin")?.builtIn).toBe(true);
    expect((await send(MEMBER, "PATCH", "/api/teams/design", { name: "Nope" })).status).toBe(403);
    const renamed = await send(ADMIN, "PATCH", "/api/teams/design", {
      name: "Design & brand",
      members: [],
    });
    expect(await renamed.json()).toMatchObject({ name: "Design & brand", members: [] });
    expect((await send(ADMIN, "POST", "/api/teams", { id: "design", name: "Again" })).status).toBe(
      409,
    );
    expect(
      (await send(ADMIN, "POST", "/api/teams", { id: "x1", name: "X", members: ["stranger"] }))
        .status,
    ).toBe(400);
    expect((await send(ADMIN, "DELETE", "/api/teams/design")).status).toBe(204);
    expect((await send(ADMIN, "DELETE", "/api/teams/design")).status).toBe(404);
  });

  it("keep the built-in teams: they are not deleted, and the admin team's permissions are locked", async () => {
    for (const id of ["admin", "developer"]) {
      expect((await send(ADMIN, "DELETE", `/api/teams/${id}`)).status).toBe(409);
    }
    const locked = await send(ADMIN, "PATCH", "/api/teams/admin", { permissions: ["tools:read"] });
    expect(locked.status).toBe(409);
    const developer = await send(ADMIN, "PATCH", "/api/teams/developer", {
      permissions: ["tools:write", "audit:read"],
    });
    expect(developer.status).toBe(200);
    expect(await developer.json()).toMatchObject({ builtIn: true, locked: false });
  });

  it("do not let someone give what they do not hold (anti-escalation)", async () => {
    const manager = holding("teams:write", "tools:write");
    await send(ADMIN, "POST", "/api/teams", { id: "ops", name: "Ops" });
    // Within what they hold: allowed.
    expect(
      (await send(manager, "PATCH", "/api/teams/ops", { permissions: ["tools:write"] })).status,
    ).toBe(200);
    // Beyond it: 403, naming what they lack.
    const beyond = await send(manager, "PATCH", "/api/teams/ops", {
      permissions: ["tools:write", "members:write"],
    });
    expect(beyond.status).toBe(403);
    expect(await beyond.json()).toMatchObject({ error: "FORBIDDEN" });
    expect(
      (await send(manager, "POST", "/api/teams", { id: "evil", name: "Evil", permissions: ["*"] }))
        .status,
    ).toBe(403);
    // Putting a person in the admin team gives them every permission.
    expect((await send(manager, "PATCH", "/api/teams/admin", { members: [memberId] })).status).toBe(
      403,
    );
    expect((await send(ADMIN, "DELETE", "/api/teams/ops")).status).toBe(204);
  });

  it("list the platform permissions, grouped, for anyone signed in", async () => {
    const res = await send(MEMBER, "GET", "/api/permissions");
    expect(res.status).toBe(200);
    const { groups } = (await res.json()) as {
      groups: Array<{
        label: string;
        permissions: Array<{ name: string; label: string; description: string; implies: string[] }>;
      }>;
    };
    expect(groups.map((g) => g.label)).toEqual([
      "Tools",
      "Access to tools",
      "Members and teams",
      "Marketplaces",
      "Workspace",
      "Operations",
    ]);
    const write = groups[0]!.permissions.find((p) => p.name === "tools:write")!;
    expect(write).toMatchObject({ label: "Build tools", implies: ["tools:read"] });
    expect(write.description).not.toBe("");
    expect(
      (await through(new Request("https://acme.forgeron.test/api/permissions"), undefined)).status,
    ).toBe(401);
  });
});
