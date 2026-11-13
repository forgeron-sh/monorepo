import {
  holds,
  PLATFORM,
  PLATFORM_PERMISSIONS,
  type PlatformPermission,
} from "@forgeron/permissions";
import { describe, expect, it } from "vitest";
import { lacking, type ConsolePerson, type Requires } from "./app";

// The answers every route of the platform API gives before its own logic runs. Each route's test
// calls `describeRouteMatrix` once, so the 401, 403, 415 and 400 rules cannot drift route by route.
// A route says which permission it requires (D-136): nobody is a 401; a person who holds everything
// but that permission is a 403; a person who holds exactly it is let in.

export interface RouteMatrix {
  title: string;
  /** Calls the app as `who` (undefined: nobody signed in). */
  call(request: Request, who: ConsolePerson | undefined): Response | Promise<Response>;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** A concrete address of the route, with a path like `/api/members/m1`. */
  path: string;
  /** The permission the route requires, or `signed-in` for any signed-in person. */
  access: Requires;
  /** A `POST` that takes no body (a revocation): no 415, no 400. */
  noBody?: boolean;
  /** The 403's message when the route words it its own way (default: the permission's label). */
  forbidden?: string;
  /** The 400's message when the route words it its own way (default `Invalid input.`). */
  invalidMessage?: string;
  /** Bodies the route's schema refuses (a write only): each must answer 400. */
  invalid?: unknown[];
  /** A body the route accepts, to tell a 415 from a 400 (a write only). */
  valid?: unknown;
}

/** A signed-in person in no team: they hold no permission. */
export const MEMBER: ConsolePerson = {
  id: "p-member",
  email: "m@acme.test",
  name: "M",
  teams: [],
  permissions: [],
};

/** A member of the admin team: every permission. */
export const ADMIN: ConsolePerson = {
  id: "p-admin",
  email: "a@acme.test",
  name: "A",
  teams: ["admin"],
  permissions: [...PLATFORM_PERMISSIONS],
};

/** A person who holds exactly these permissions (and what they imply). */
export const holding = (...permissions: PlatformPermission[]): ConsolePerson => ({
  id: "p-holder",
  email: "h@acme.test",
  name: "H",
  teams: ["holders"],
  permissions: PLATFORM_PERMISSIONS.filter((p) => holds(PLATFORM, permissions, p)),
});

/** A person who holds every permission but the ones that give `permission`. */
const holdingAllBut = (permission: PlatformPermission): ConsolePerson => ({
  id: "p-almost",
  email: "x@acme.test",
  name: "X",
  teams: ["almost"],
  permissions: PLATFORM_PERMISSIONS.filter((p) => !holds(PLATFORM, [p], permission)),
});

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
  const write = m.method !== "GET" && m.method !== "DELETE" && !m.noBody;
  const asAllowed = m.access === "signed-in" ? MEMBER : holding(m.access);
  describe(`${m.title}: common answers`, () => {
    it("401 UNAUTHENTICATED for nobody, never cached", async () => {
      const res = await m.call(json(m, m.valid ?? {}), undefined);
      expect(res.status).toBe(401);
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(await res.json()).toEqual({ error: "UNAUTHENTICATED" });
    });

    it.runIf(m.access !== "signed-in")(
      "403 FORBIDDEN for a person without the permission",
      async () => {
        const wanted = m.access as PlatformPermission;
        const message = m.forbidden ?? lacking(wanted);
        for (const who of [MEMBER, holdingAllBut(wanted)]) {
          const res = await m.call(json(m, m.valid ?? {}), who);
          expect(res.status).toBe(403);
          expect(res.headers.get("cache-control")).toBe("no-store");
          expect(await res.json()).toEqual({ error: "FORBIDDEN", message });
        }
      },
    );

    it("lets in the person who holds the permission, and an admin", async () => {
      for (const who of [asAllowed, ADMIN]) {
        const res = await Promise.resolve(m.call(json(m, m.valid ?? {}), who)).catch(
          () => undefined,
        );
        expect([401, 403]).not.toContain(res?.status);
      }
    });

    it.runIf(m.method !== "GET")(
      "403 for a write a browser sends from another origin (D-073)",
      async () => {
        const from = (headers: Record<string, string>) => {
          const body = write ? JSON.stringify(m.valid ?? {}) : null;
          return new Request(url(m.path), {
            method: m.method,
            headers: { ...(write ? { "content-type": "application/json" } : {}), ...headers },
            body,
          });
        };
        // Who is asked first: nobody signed in is a 401, not a statement about the origin.
        expect((await m.call(from({ origin: "https://evil.test" }), undefined)).status).toBe(401);
        const refused: Array<Record<string, string>> = [
          { origin: "https://evil.test" },
          { origin: "null" },
          { origin: "https://globex.forgeron.test" },
          { "sec-fetch-site": "cross-site" },
          { "sec-fetch-site": "same-site", origin: "https://acme.forgeron.test" },
        ];
        for (const headers of refused) {
          const res = await m.call(from(headers), asAllowed);
          expect(`${JSON.stringify(headers)} -> ${res.status}`).toBe(
            `${JSON.stringify(headers)} -> 403`,
          );
          expect(await res.json()).toEqual({
            error: "FORBIDDEN",
            message: "Cross-origin writes are refused.",
          });
        }
        // The page itself, and a client that is not a browser, are let through.
        const allowed: Array<Record<string, string>> = [
          { origin: "https://acme.forgeron.test" },
          { "sec-fetch-site": "same-origin" },
          { "sec-fetch-site": "same-origin", origin: "https://acme.forgeron.test" },
          {},
        ];
        for (const headers of allowed) {
          // The handler may then fail on the matrix's stand-ins: that it ran is what is checked.
          const res = await Promise.resolve(m.call(from(headers), asAllowed)).catch(
            () => undefined,
          );
          expect(`${JSON.stringify(headers)} -> ${res?.status}`).not.toBe(
            `${JSON.stringify(headers)} -> 403`,
          );
        }
      },
    );

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
        expect(await res.json()).toEqual({
          error: "INVALID",
          message: m.invalidMessage ?? "Invalid input.",
        });
      },
    );
  });
}
