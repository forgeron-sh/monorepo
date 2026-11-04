import { describe, expect, it } from "vitest";
import type { Access, ConsolePerson } from "./app";

// The answers every route of the platform API gives before its own logic runs. Each route's test
// calls `describeRouteMatrix` once, so the 401, 403, 415 and 400 rules cannot drift route by route.

export interface RouteMatrix {
  title: string;
  /** Calls the app as `who` (undefined: nobody signed in). */
  call(request: Request, who: ConsolePerson | undefined): Response | Promise<Response>;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** A concrete address of the route, with a path like `/api/members/m1`. */
  path: string;
  access: Access;
  /** Bodies the route's schema refuses (a write only): each must answer 400. */
  invalid?: unknown[];
  /** A body the route accepts, to tell a 415 from a 400 (a write only). */
  valid?: unknown;
}

export const MEMBER: ConsolePerson = { id: "p-member", admin: false, developer: false, roles: [] };
export const ADMIN: ConsolePerson = {
  id: "p-admin",
  admin: true,
  developer: false,
  roles: ["admin"],
};

const url = (path: string) => `https://acme.forgeron.test${path}`;
const json = (m: RouteMatrix, body: unknown) =>
  m.method === "GET" || m.method === "DELETE"
    ? new Request(url(m.path), { method: m.method })
    : new Request(url(m.path), {
        method: m.method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

export function describeRouteMatrix(m: RouteMatrix): void {
  const write = m.method !== "GET" && m.method !== "DELETE";
  const asAllowed = m.access === "admin" ? ADMIN : MEMBER;
  describe(`${m.title}: common answers`, () => {
    it("401 UNAUTHENTICATED for nobody, never cached", async () => {
      const res = await m.call(json(m, m.valid ?? {}), undefined);
      expect(res.status).toBe(401);
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(await res.json()).toEqual({ error: "UNAUTHENTICATED" });
    });

    it.runIf(m.access === "admin")("403 FORBIDDEN for a member who is not an admin", async () => {
      const res = await m.call(json(m, m.valid ?? {}), MEMBER);
      expect(res.status).toBe(403);
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(await res.json()).toEqual({ error: "FORBIDDEN", message: "This is for admins." });
    });

    it.runIf(write)("415 for a body that is not JSON, after the checks on who calls", async () => {
      const form = () =>
        new Request(url(m.path), {
          method: m.method,
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: write ? "a=b" : null,
        });
      expect((await m.call(form(), undefined)).status).toBe(401);
      const res = await m.call(form(), asAllowed);
      expect(res.status).toBe(415);
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(await res.json()).toEqual({ error: "INVALID", message: "Send JSON." });
    });

    it.runIf(write)("400 INVALID for JSON that is malformed", async () => {
      const res = await m.call(
        new Request(url(m.path), {
          method: m.method,
          headers: { "content-type": "application/json" },
          body: write ? "{not json" : null,
        }),
        asAllowed,
      );
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: "INVALID" });
    });

    it.runIf(write).each((m.invalid ?? []).map((body, i) => [i + 1, body] as const))(
      "400 INVALID for a body the schema refuses (#%i)",
      async (_n, body) => {
        const res = await m.call(json(m, body), asAllowed);
        expect(res.status).toBe(400);
        expect(res.headers.get("cache-control")).toBe("no-store");
        expect(await res.json()).toEqual({ error: "INVALID", message: "Invalid input." });
      },
    );
  });
}
