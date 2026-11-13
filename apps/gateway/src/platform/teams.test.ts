import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ConsolePerson } from "./app";
import { ADMIN, describeRouteMatrix, MEMBER } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The common answers of the teams routes (D-132), then what they do: an admin creates, renames and
// deletes; anyone signed in reads.

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
      roles: [],
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
  call: through,
  method: "GET",
  path: "/api/teams",
  access: "member",
});
describeRouteMatrix({
  title: "POST /api/teams",
  call: through,
  method: "POST",
  path: "/api/teams",
  access: "admin",
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
  call: through,
  method: "PATCH",
  path: "/api/teams/ops",
  access: "admin",
  valid: { name: "Ops" },
  invalid: [{ name: "" }, { members: "all" }],
});
describeRouteMatrix({
  title: "DELETE /api/teams/<id>",
  call: through,
  method: "DELETE",
  path: "/api/teams/ghost",
  access: "admin",
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
  it("are created and changed by an admin, and read by anyone signed in", async () => {
    const created = await send(ADMIN, "POST", "/api/teams", {
      id: "design",
      name: "Design",
      members: [memberId],
    });
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({
      id: "design",
      role: "team-design",
      members: [memberId],
    });
    const read = await send(MEMBER, "GET", "/api/teams");
    expect(
      ((await read.json()) as { teams: Array<{ id: string }> }).teams.map((t) => t.id),
    ).toContain("design");
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
});
