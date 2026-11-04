import { defineRoute, ErrorSchema } from "@forgeron/platform-contract";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  createPlatformApp,
  crossOriginWrite,
  platformRoute,
  UNMATCHED,
  type ConsolePerson,
} from "./app";
import { ADMIN, describeRouteMatrix, MEMBER } from "./route-matrix";

// A route of the contract that exists for this test only: the shell has no real route yet (D-064).
const Thing = z.strictObject({ name: z.string().min(1) });
const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const errors = { 400: json(ErrorSchema, "Invalid"), 401: json(ErrorSchema, "Not signed in") };
const readThing = defineRoute({
  method: "get",
  path: "/api/__thing",
  responses: { 200: json(Thing, "The thing"), 401: errors[401] },
});
const saveThing = defineRoute({
  method: "put",
  path: "/api/__thing",
  request: { body: { content: { "application/json": { schema: Thing } }, required: true } },
  responses: { 200: json(Thing, "Saved"), ...errors },
});
const boom = defineRoute({
  method: "get",
  path: "/api/__boom",
  responses: { 200: json(Thing, "never") },
});

const app = createPlatformApp();
app.openapi(platformRoute(readThing, "member"), (c) => c.json({ name: "a" }, 200));
app.openapi(platformRoute(saveThing, "admin"), (c) => c.json(c.req.valid("json"), 200));
app.openapi(platformRoute(boom, "member"), () => {
  throw new Error("registry down");
});

const as = (who: ConsolePerson | undefined) => ({ identity: async () => who });
const call = (request: Request, who: ConsolePerson | undefined) => app.fetch(request, as(who));
const get = (path: string, who?: ConsolePerson, init?: RequestInit) =>
  call(new Request(`https://acme.forgeron.test${path}`, init), who);

describeRouteMatrix({
  title: "GET /api/__thing",
  call,
  method: "GET",
  path: "/api/__thing",
  access: "member",
});
describeRouteMatrix({
  title: "PUT /api/__thing",
  call,
  method: "PUT",
  path: "/api/__thing",
  access: "admin",
  valid: { name: "a" },
  invalid: [{ name: "" }, { name: 1 }, { name: "a", extra: true }, "text", null],
});

describe("the shell", () => {
  it("answers a route it owns as the matrix says, and passes the person on", async () => {
    const res = await get("/api/__thing", MEMBER);
    expect(res.status).toBe(200);
    expect(res.headers.get(UNMATCHED)).toBeNull();
    expect(await res.json()).toEqual({ name: "a" });
    const saved = await get("/api/__thing", ADMIN, {
      method: "PUT",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ name: "b" }),
    });
    expect(await saved.json()).toEqual({ name: "b" });
  });

  it("leaves a path it does not own to the hand-written chain, whoever asks and however", async () => {
    for (const who of [undefined, MEMBER]) {
      for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
        const res = await get("/api/members", who, {
          method,
          ...(method === "GET" || method === "DELETE"
            ? {}
            : { headers: { "content-type": "text/plain" }, body: "x" }),
        });
        expect(res.status).toBe(404);
        expect(res.headers.get(UNMATCHED)).toBe("1");
      }
    }
    // The person is not even looked up for it.
    let looked = 0;
    await app.fetch(new Request("https://acme.forgeron.test/api/tools"), {
      identity: async () => (looked++, undefined),
    });
    expect(looked).toBe(0);
  });

  it("a failure of a handler is not turned into an answer: the Worker logs it and answers 500", async () => {
    await expect(get("/api/__boom", MEMBER)).rejects.toThrow("registry down");
  });
});

describe("the Origin check on writes (D-073)", () => {
  const write = (headers: Record<string, string>) =>
    new Request("https://acme.forgeron.app/api/x", { method: "PUT", headers });

  it("refuses what a browser says comes from elsewhere", () => {
    const refused: Array<Record<string, string>> = [
      { origin: "https://evil.test" },
      { origin: "http://acme.forgeron.app" },
      { origin: "https://acme.forgeron.app:8443" },
      { origin: "https://globex.forgeron.app" },
      { origin: "null" },
      { "sec-fetch-site": "cross-site" },
      { "sec-fetch-site": "same-site" },
      { "sec-fetch-site": "cross-site", origin: "https://acme.forgeron.app" },
    ];
    for (const headers of refused) {
      expect([JSON.stringify(headers), crossOriginWrite(write(headers))]).toEqual([
        JSON.stringify(headers),
        true,
      ]);
    }
  });

  it("lets through the page itself and a client that is not a browser", () => {
    const allowed: Array<Record<string, string>> = [
      { origin: "https://acme.forgeron.app" },
      { "sec-fetch-site": "same-origin" },
      { "sec-fetch-site": "same-origin", origin: "null" },
      {},
      { authorization: "Bearer a-token" },
    ];
    for (const headers of allowed) {
      expect([JSON.stringify(headers), crossOriginWrite(write(headers))]).toEqual([
        JSON.stringify(headers),
        false,
      ]);
    }
  });
});
