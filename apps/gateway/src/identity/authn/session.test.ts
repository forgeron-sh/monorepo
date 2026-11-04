import { describe, expect, it } from "vitest";
import { closeSession, openSession, SESSION_COOKIE } from "./session";

const options = { secret: "s".repeat(32), ttlSeconds: 3600, now: new Date("2026-01-01T00:00:00Z") };

// sdk.md §7, Isolation point 4: out of reach of script, HTTPS only, and not sent on a cross-site write.
describe("the workspace session cookie", () => {
  for (const [name, header] of [
    ["opened", () => openSession({ person: "p1", workspace: "acme" }, options)],
    ["closed", async () => closeSession()],
  ] as const) {
    it(`is HttpOnly, Secure, SameSite=Lax and host-bound when ${name}`, async () => {
      const cookie = await header();
      const attributes = cookie.split("; ").slice(1);
      expect(cookie.startsWith(`${SESSION_COOKIE}=`)).toBe(true);
      expect(SESSION_COOKIE.startsWith("__Host-")).toBe(true);
      expect(attributes).toEqual(
        expect.arrayContaining(["Path=/", "HttpOnly", "Secure", "SameSite=Lax"]),
      );
      expect(attributes.some((a) => /^domain=/i.test(a))).toBe(false);
    });
  }
});
