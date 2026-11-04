import { readFileSync } from "node:fs";
import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { addressOf, createClient, defineRoute, ErrorSchema, type Answer } from "./index";

const getThing = defineRoute({
  method: "get",
  path: "/api/things/{id}",
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({ deep: z.boolean().optional() }),
  },
  responses: {
    200: {
      description: "The thing",
      content: { "application/json": { schema: z.object({ n: z.number() }) } },
    },
    404: { description: "No such thing", content: { "application/json": { schema: ErrorSchema } } },
  },
});
const putThing = defineRoute({
  method: "put",
  path: "/api/thing",
  request: { body: { content: { "application/json": { schema: z.object({ n: z.number() }) } } } },
  responses: { 204: { description: "Saved" } },
});

describe("createClient", () => {
  it("fills the path and the query, and tells the answers apart by status", async () => {
    const seen: string[] = [];
    const call = createClient(async (url, init) => {
      seen.push(`${init?.method} ${url}`);
      return Response.json({ n: 1 });
    }, "https://x.test/console-api");
    const answer = await call(getThing, { params: { id: "a b" }, query: { deep: true } });
    expect(seen).toEqual(["GET https://x.test/console-api/api/things/a%20b?deep=true"]);
    expect(answer).toEqual({ status: 200, body: { n: 1 } });
    expectTypeOf(answer).toEqualTypeOf<Answer<typeof getThing>>();
    if (answer.status === 404) expectTypeOf(answer.body.error).toBeString();
  });

  it("sends a JSON body with its content type, and reads an empty answer", async () => {
    let sent: RequestInit | undefined;
    const call = createClient(async (_url, init) => {
      sent = init;
      return new Response(null, { status: 204 });
    }, "");
    const answer = await call(putThing, { json: { n: 2 } });
    expect(sent?.body).toBe('{"n":2}');
    expect(new Headers(sent?.headers).get("content-type")).toBe("application/json");
    expect(answer).toEqual({ status: 204, body: undefined });
  });

  it("takes an address typed from the route in place of the route", async () => {
    const call = createClient(async () => Response.json({ n: 3 }), "");
    const address = addressOf<typeof getThing>({ method: "get", path: "/api/things/{id}" });
    const answer = await call(address, { params: { id: "a" }, query: {} });
    expect(answer).toEqual({ status: 200, body: { n: 3 } });
    expectTypeOf(answer).toEqualTypeOf<Answer<typeof getThing>>();
    // @ts-expect-error the route is not at this path
    addressOf<typeof getThing>({ method: "get", path: "/api/other" });
    // @ts-expect-error the route is not a PUT
    addressOf<typeof getThing>({ method: "put", path: "/api/things/{id}" });
  });

  it("a browser can import the client without any schema: its entry only imports types from zod", () => {
    for (const file of ["client.ts", "route.ts"]) {
      const source = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
      const imports = [...source.matchAll(/^import\s+(type\s+)?[^;]*?from\s+"([^"]+)"/gms)];
      expect(imports.filter((m) => m[2] === "zod" && !m[1])).toEqual([]);
      expect(imports.filter((m) => m[2]!.startsWith("@forgeron/"))).toEqual([]);
    }
  });
});
