import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ConsolePerson } from "./app";
import { describeRouteMatrix, MEMBER } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

let memory: MemoryD1;
let registry: Registry;
let person: ConsolePerson | undefined;
let call: (request: Request) => Promise<Response | undefined>;
let me: ConsolePerson;

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  const { id } = await registry.addMember({
    workspace: "acme",
    subject: "s1",
    email: "ada@acme.test",
    name: "Ada",
    teams: [],
  });
  me = { ...MEMBER, id, email: "ada@acme.test", name: "Ada" };
  call = platformCaller({ registry, who: () => person, installDomains: ["acme.test"] });
});
afterAll(() => memory.close());

const through = async (request: Request, who: ConsolePerson | undefined) => {
  person = who;
  return (await call(request))!;
};

describeRouteMatrix({
  title: "PUT /api/me/avatar",
  call: through,
  method: "PUT",
  path: "/api/me/avatar",
  access: "signed-in",
  valid: { image: null },
  invalid: [
    {},
    { image: "https://evil.test/x.png" },
    { image: "data:text/html;base64,PGI+" },
    { image: 5 },
  ],
});

const put = (image: string | null) =>
  through(
    new Request("https://acme.forgeron.test/api/me/avatar", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image }),
    }),
    me,
  );
const workspace = async () =>
  (await (await through(new Request("https://acme.forgeron.test/api/workspace"), me)).json()) as {
    person: { avatar?: { url: string; source: string } };
  };

describe("your own picture (D-133)", () => {
  it("is set from the profile, shown by the workspace, and given back with null", async () => {
    expect((await workspace()).person.avatar).toBeUndefined();
    const set = await put(PNG);
    expect(set.status).toBe(200);
    const body = (await set.json()) as { avatar: { url: string; source: string } };
    expect(body.avatar.source).toBe("custom");
    expect(body.avatar.url).toMatch(new RegExp("/avatars/" + me.id + "\\?v="));
    expect((await workspace()).person.avatar?.source).toBe("custom");
    const cleared = await put(null);
    expect(((await cleared.json()) as { avatar: unknown }).avatar).toBeNull();
  });

  it("refuses a picture that is not a small png, jpeg or webp", async () => {
    expect((await put("data:image/png;base64," + "A".repeat(90_000))).status).toBe(400);
  });
});
