import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { memoryMailSender } from "../mail/mail";
import { simulatedProvider } from "../simulated-idp";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// Sign-in by email (D-049) against the gateway handler, with a simulated mail sender and an
// in-memory platform D1: the code in the mail is the only way in, and every refusal looks alike.

const ORIGIN = "https://acme.forgeron.app";
let clock = new Date("2026-11-03T10:00:00Z");
let memory: MemoryD1;
let registry: Registry;
let env: GatewayEnv;
const mail = memoryMailSender();
let deferred: Promise<unknown>[] = [];

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  env = {
    DB: d1,
    BASE_DOMAIN: "forgeron.app",
    AUTH_SECRET: "test-secret-not-a-real-one",
    ADMIN_EMAIL: "root@acme.fr",
    SIGN_IN_METHODS: "email",
  };
});
afterAll(() => memory.close());
// Each test starts with no request on record: the limits are tried in the tests that are about them.
beforeEach(async () => {
  await memory.exec(`DELETE FROM "email_codes"`);
});

const gateway = (over: Partial<GatewayEnv> = {}, fetcher?: typeof fetch) =>
  createGateway(
    { ...env, ...over },
    { now: () => clock, mail, ...(fetcher ? { fetch: fetcher } : {}) },
  );
const cookiesOf = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0]!)
    .filter((c) => !c.endsWith("="))
    .join("; ");
const form = (fields: Record<string, string>, extra: Record<string, string> = {}) => ({
  method: "POST",
  headers: { origin: ORIGIN, "content-type": "application/x-www-form-urlencoded", ...extra },
  body: new URLSearchParams(fields),
});
const json = (method: string, body: unknown, cookie: string) => ({
  method,
  headers: { "content-type": "application/json", cookie },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const requestCode = (
  email: string,
  extra: { ip?: string; next?: string; gw?: ReturnType<typeof gateway> } = {},
) =>
  (extra.gw ?? gateway())(
    new Request(
      `${ORIGIN}/auth/email/request`,
      form(
        { email, ...(extra.next ? { next: extra.next } : {}) },
        { "cf-connecting-ip": extra.ip ?? "203.0.113.7" },
      ),
    ),
  );
const verify = (code: string, cookie: string, extra: Record<string, string> = {}) =>
  gateway()(new Request(`${ORIGIN}/auth/email/verify`, form({ code }, { cookie, ...extra })));
const lastCode = () => /(\d{4}) (\d{4})/.exec(mail.sent.at(-1)!.text)!.slice(1, 3).join("");

/** Asks for a code and signs in with it: the session cookie. */
async function signIn(email: string, ip = "203.0.113.7") {
  const before = mail.sent.length;
  const asked = await requestCode(email, { ip });
  expect(mail.sent.length).toBe(before + 1);
  const done = await verify(lastCode(), cookiesOf(asked));
  expect(done.status).toBe(303);
  return cookiesOf(done);
}
const whoami = async (cookie: string) =>
  gateway()(new Request(`${ORIGIN}/whoami`, { headers: { cookie } }));

describe("the first administrator", () => {
  it("signs in with --admin-email, gets the admin role and a session like any provider's", async () => {
    const asked = await requestCode("Root@Acme.fr");
    expect(asked.status).toBe(200);
    expect(mail.sent.at(-1)).toMatchObject({ to: "root@acme.fr" });
    // A code to type, not a link a mail scanner could open.
    expect(mail.sent.at(-1)!.text).not.toMatch(/https?:\/\//);
    const done = await verify(lastCode(), cookiesOf(asked));
    expect(done.status).toBe(303);
    expect(done.headers.get("location")).toBe("/");
    const session = done.headers.getSetCookie().find((c) => c.startsWith("__Host-fg_session="))!;
    expect(session).toMatch(/HttpOnly/);
    expect(session).toMatch(/Secure/);
    expect(session).toMatch(/SameSite=Lax/);
    expect(session).toMatch(/Path=\//);
    expect(session).not.toMatch(/Domain/);
    const me = await (await whoami(cookiesOf(done))).json();
    expect(me).toMatchObject({
      email: "root@acme.fr",
      roles: ["admin", "member"],
      workspace: "acme",
    });
  });

  it("stores the code hashed, never in the clear", async () => {
    await requestCode("root@acme.fr", { ip: "203.0.113.50" });
    const code = lastCode();
    const rows = (await memory.prepare(`SELECT * FROM "email_codes"`).all()).results as Array<
      Record<string, unknown>
    >;
    expect(JSON.stringify(rows)).not.toContain(code);
    expect(rows.every((r) => !String(r.ip_hash).includes("203.0.113"))).toBe(true);
  });
});

/** The page without the address the person typed: the page echoes it back, nothing else may differ. */
const anonymous = async (response: Response, email: string) =>
  (await response.text()).replaceAll(email, "ADDRESS");

describe("a person who may not sign in", () => {
  it("gets the very same answer and no mail, and no code can open the door", async () => {
    const before = mail.sent.length;
    const known = await requestCode("root@acme.fr", { ip: "198.51.100.1" });
    const stranger = await requestCode("stranger@elsewhere.test", { ip: "198.51.100.2" });
    expect(mail.sent.length).toBe(before + 1);
    expect(stranger.status).toBe(known.status);
    expect(await anonymous(stranger, "stranger@elsewhere.test")).toBe(
      await anonymous(known, "root@acme.fr"),
    );
    expect(stranger.headers.getSetCookie().length).toBe(known.headers.getSetCookie().length);
    expect(stranger.headers.getSetCookie()[0]!.split("=")[0]).toBe(
      known.headers.getSetCookie()[0]!.split("=")[0],
    );
    // The stranger's own guess fails like a wrong code does for anyone.
    const guess = await verify("12345678", cookiesOf(stranger));
    const wrong = await verify("00000000", cookiesOf(known));
    expect(guess.status).toBe(400);
    expect(await anonymous(guess, "stranger@elsewhere.test")).toBe(
      await anonymous(wrong, "root@acme.fr"),
    );
  });

  it("is not made a member by a request alone", async () => {
    await requestCode("nobody@elsewhere.test", { ip: "198.51.100.3" });
    expect(await registry.findMemberByEmail("acme", "nobody@elsewhere.test")).toBeUndefined();
  });

  it("looks alike when the mail cannot be sent", async () => {
    const broken = createGateway(
      { ...env },
      {
        now: () => clock,
        mail: {
          send: async () => {
            throw new Error("mail domain not verified");
          },
        },
      },
    );
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const a = await requestCode("root@acme.fr", { ip: "198.51.100.4", gw: broken });
    const b = await requestCode("nobody@elsewhere.test", { ip: "198.51.100.5", gw: broken });
    expect(a.status).toBe(200);
    expect(await anonymous(a, "root@acme.fr")).toBe(await anonymous(b, "nobody@elsewhere.test"));
    expect(JSON.stringify(log.mock.calls)).not.toContain("root@acme.fr");
    log.mockRestore();
  });

  it("sends the mail after the answer when the Worker can defer it", async () => {
    const gw = createGateway(env, {
      now: () => clock,
      mail,
      defer: (work) => deferred.push(work),
    });
    const before = mail.sent.length;
    await requestCode("root@acme.fr", { ip: "198.51.100.6", gw });
    await Promise.all(deferred);
    deferred = [];
    expect(mail.sent.length).toBe(before + 1);
  });
});

describe("the code", () => {
  it("works once", async () => {
    const asked = await requestCode("root@acme.fr", { ip: "192.0.2.1" });
    const code = lastCode();
    expect((await verify(code, cookiesOf(asked))).status).toBe(303);
    expect((await verify(code, cookiesOf(asked))).status).toBe(400);
  });

  it("is refused after five wrong tries, even with the right code", async () => {
    const asked = await requestCode("root@acme.fr", { ip: "192.0.2.2" });
    const code = lastCode();
    const wrong = code === "00000000" ? "11111111" : "00000000";
    for (let i = 0; i < 5; i++) expect((await verify(wrong, cookiesOf(asked))).status).toBe(400);
    expect((await verify(code, cookiesOf(asked))).status).toBe(400);
  });

  it("counts parallel guesses too: no more than five are weighed", async () => {
    const asked = await requestCode("root@acme.fr", { ip: "192.0.2.3" });
    const code = lastCode();
    const wrong = code === "00000000" ? "11111111" : "00000000";
    await Promise.all(Array.from({ length: 12 }, () => verify(wrong, cookiesOf(asked))));
    const row = (await memory.prepare(`SELECT MAX("attempts") AS n FROM "email_codes"`).all())
      .results![0] as { n: number };
    expect(row.n).toBeLessThanOrEqual(5);
  });

  it("expires after ten minutes", async () => {
    const asked = await requestCode("root@acme.fr", { ip: "192.0.2.4" });
    const code = lastCode();
    clock = new Date(clock.getTime() + 10 * 60 * 1000 + 1000);
    expect((await verify(code, cookiesOf(asked))).status).toBe(400);
    clock = new Date(clock.getTime() - 10 * 60 * 1000 - 1000);
  });

  it("is bound to the browser that asked: no cookie, or another browser's cookie, is refused", async () => {
    const mine = await requestCode("root@acme.fr", { ip: "192.0.2.5" });
    const code = lastCode();
    const other = await requestCode("root@acme.fr", { ip: "192.0.2.6" });
    expect((await verify(code, "")).status).toBe(400);
    expect((await verify(code, cookiesOf(other))).status).toBe(400);
    expect((await verify(code, "__Host-fg_email=fge.e30.AAAA")).status).toBe(400);
    expect((await verify(code, cookiesOf(mine))).status).toBe(303);
  });

  it("accepts the code as it is shown, spaces and all", async () => {
    const asked = await requestCode("root@acme.fr", { ip: "192.0.2.7" });
    const shown = /\d{4} \d{4}/.exec(mail.sent.at(-1)!.text)![0];
    expect((await verify(shown, cookiesOf(asked))).status).toBe(303);
  });

  it("refuses a code that is not eight digits without weighing it", async () => {
    const asked = await requestCode("root@acme.fr", { ip: "192.0.2.8" });
    for (const bad of ["", "abc", "1234", "1234567890"]) {
      expect((await verify(bad, cookiesOf(asked))).status).toBe(400);
    }
    expect((await verify(lastCode(), cookiesOf(asked))).status).toBe(303);
  });
});

describe("abuse", () => {
  it("limits requests per address, the same for every address", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      statuses.push((await requestCode("limited@elsewhere.test", { ip: `10.1.0.${i}` })).status);
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429, 429]);
    // A known address is limited the same way: the limit tells nothing.
    const known: number[] = [];
    for (let i = 0; i < 7; i++) {
      known.push((await requestCode("limited@acme.fr", { ip: `10.2.0.${i}` })).status);
    }
    expect(known).toEqual(statuses);
  });

  it("limits requests per source address", async () => {
    let last = 200;
    for (let i = 0; i < 22; i++) {
      last = (await requestCode(`spray${i}@elsewhere.test`, { ip: "10.3.0.1" })).status;
    }
    expect(last).toBe(429);
    expect((await requestCode("spray@elsewhere.test", { ip: "10.3.0.2" })).status).toBe(200);
  });

  it("refuses a post from another origin, or from none, before doing anything", async () => {
    const before = mail.sent.length;
    for (const origin of ["https://evil.test", undefined]) {
      const init = form({ email: "root@acme.fr" });
      if (origin) init.headers.origin = origin;
      else delete (init.headers as Record<string, string>).origin;
      const response = await gateway()(new Request(`${ORIGIN}/auth/email/request`, init));
      expect(response.status).toBe(403);
    }
    const asked = await requestCode("root@acme.fr", { ip: "192.0.2.9" });
    const code = lastCode();
    const cross = await verify(code, cookiesOf(asked), { origin: "https://evil.test" });
    expect(cross.status).toBe(403);
    expect(mail.sent.length).toBe(before + 1);
    // The code was not weighed by the refused post.
    expect((await verify(code, cookiesOf(asked))).status).toBe(303);
  });

  it("accepts a same-origin form post that carries a null origin, and nothing cross-site", async () => {
    const post = (headers: Record<string, string>) => {
      const init = form({ email: "root@acme.fr" });
      delete (init.headers as Record<string, string>).origin;
      Object.assign(init.headers, headers);
      return gateway()(new Request(`${ORIGIN}/auth/email/request`, init));
    };
    expect((await post({ origin: "null", "sec-fetch-site": "same-origin" })).status).toBe(200);
    expect((await post({ "sec-fetch-site": "same-origin" })).status).toBe(200);
    expect((await post({ origin: "null", "sec-fetch-site": "cross-site" })).status).toBe(403);
    expect((await post({ origin: "null" })).status).toBe(403);
  });

  it("keeps the sign-in page's referrer policy at same-origin so browsers send the origin", async () => {
    const page = await gateway()(new Request(`${ORIGIN}/auth/login`));
    expect(page.headers.get("referrer-policy")).toBe("same-origin");
  });

  it("does not follow a next that is not the CLI's own page", async () => {
    for (const next of ["https://evil.test/", "//evil.test", "/console", "/auth/cli\n"]) {
      const asked = await requestCode("root@acme.fr", { ip: "192.0.2.10", next });
      const done = await verify(lastCode(), cookiesOf(asked));
      expect(done.headers.get("location")).toBe("/");
    }
  });

  it("serves its pages locked down, and escapes what it shows", async () => {
    const page = await gateway()(new Request(`${ORIGIN}/auth/login?next=%22%3E%3Cscript%3E`));
    expect(page.status).toBe(200);
    expect(page.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(page.headers.get("cache-control")).toBe("no-store");
    expect(await page.text()).not.toContain("<script>");
  });

  it("issues a new session on each sign-in; an old cookie is not reused", async () => {
    const stale = "__Host-fg_session=old-and-wrong";
    const asked = await requestCode("root@acme.fr", { ip: "192.0.2.11" });
    const done = await verify(lastCode(), `${cookiesOf(asked)}; ${stale}`);
    const session = done.headers.getSetCookie().find((c) => c.startsWith("__Host-fg_session="))!;
    expect(session).not.toContain("old-and-wrong");
  });
});

describe("members, invitations and domains", () => {
  let admin = "";
  it("an admin lists, and a non-admin is refused", async () => {
    admin = await signIn("root@acme.fr", "192.0.2.20");
    const list = await gateway()(
      new Request(`${ORIGIN}/console-api/api/members`, json("GET", undefined, admin)),
    );
    expect(list.status).toBe(200);
    const body = (await list.json()) as { members: Array<{ email: string }>; settings: unknown };
    expect(body.members.map((m) => m.email)).toContain("root@acme.fr");
    expect(body.settings).toMatchObject({ domains: [], source: "install" });
    expect((await gateway()(new Request(`${ORIGIN}/console-api/api/members`))).status).toBe(401);
  });

  it("an invited email joins with its role by signing in, once", async () => {
    const before = mail.sent.length;
    const invited = await gateway()(
      new Request(
        `${ORIGIN}/console-api/api/invitations`,
        json("POST", { email: "Ada@External.test", roles: ["developer"] }, admin),
      ),
    );
    expect(invited.status).toBe(201);
    expect(await invited.json()).toMatchObject({ notified: true });
    expect(mail.sent.length).toBe(before + 1);
    expect(mail.sent.at(-1)).toMatchObject({ to: "ada@external.test" });
    const dup = await gateway()(
      new Request(
        `${ORIGIN}/console-api/api/invitations`,
        json("POST", { email: "root@acme.fr", roles: [] }, admin),
      ),
    );
    expect(dup.status).toBe(409);

    const session = await signIn("ada@external.test", "192.0.2.21");
    const me = (await (await whoami(session)).json()) as { roles: string[] };
    expect(me.roles).toEqual(["developer", "member"]);
    // Accepted: the invitation is gone, and the audit log says who joined and how.
    expect(await registry.findInvitation("acme", "ada@external.test")).toBeUndefined();
    const audit = (
      await memory
        .prepare(`SELECT "subject", "detail" FROM "audit_log" WHERE "subject" LIKE 'member:%'`)
        .all()
    ).results as Array<{ subject: string; detail: string }>;
    expect(audit.map((a) => a.subject)).toEqual(
      expect.arrayContaining(["member:invite", "member:join"]),
    );
  });

  it("an expired or withdrawn invitation lets nobody in and mails nothing", async () => {
    await registry.inviteMember("acme", {
      email: "late@external.test",
      roles: [],
      invitedBy: "x",
      expiresAt: new Date(clock.getTime() + 1000),
    });
    await registry.inviteMember("acme", {
      email: "gone@external.test",
      roles: [],
      invitedBy: "x",
      expiresAt: new Date(clock.getTime() + 100000),
    });
    const withdrawn = await gateway()(
      new Request(
        `${ORIGIN}/console-api/api/invitations/${encodeURIComponent("gone@external.test")}`,
        json("DELETE", undefined, admin),
      ),
    );
    expect(withdrawn.status).toBe(204);
    clock = new Date(clock.getTime() + 5000);
    const before = mail.sent.length;
    await requestCode("late@external.test", { ip: "192.0.2.22" });
    await requestCode("gone@external.test", { ip: "192.0.2.23" });
    expect(mail.sent.length).toBe(before);
    clock = new Date(clock.getTime() - 5000);
  });

  it("an address of an allowed domain joins by itself with the default role; others do not", async () => {
    const saved = await gateway()(
      new Request(
        `${ORIGIN}/console-api/api/membership-settings`,
        json("PUT", { domains: ["Acme.fr"], defaultRole: "viewer" }, admin),
      ),
    );
    expect(saved.status).toBe(200);
    expect(await saved.json()).toMatchObject({
      domains: ["acme.fr"],
      defaultRole: "viewer",
      source: "console",
    });
    const session = await signIn("grace@acme.fr", "192.0.2.24");
    expect(((await (await whoami(session)).json()) as { roles: string[] }).roles).toEqual([
      "viewer",
      "member",
    ]);
    // A lookalike domain, and a subdomain, do not count.
    const before = mail.sent.length;
    await requestCode("eve@acme.fr.evil.test", { ip: "192.0.2.25" });
    await requestCode("eve@mail.acme.fr", { ip: "192.0.2.26" });
    expect(mail.sent.length).toBe(before);
  });

  it("refuses admin as a default role and a bad domain", async () => {
    for (const body of [
      { domains: ["acme.fr"], defaultRole: "admin" },
      { domains: ["not a domain"] },
      { domains: ["a@b.fr"] },
    ]) {
      const response = await gateway()(
        new Request(`${ORIGIN}/console-api/api/membership-settings`, json("PUT", body, admin)),
      );
      expect(response.status).toBe(400);
    }
  });

  it("changes a role and removes a member, and a removed member's session stops at once", async () => {
    const grace = (await registry.findMemberByEmail("acme", "grace@acme.fr"))!;
    const session = await signIn("grace@acme.fr", "192.0.2.27");
    const patched = await gateway()(
      new Request(
        `${ORIGIN}/console-api/api/members/${grace.id}`,
        json("PATCH", { roles: ["developer", "viewer"] }, admin),
      ),
    );
    expect(((await patched.json()) as { roles: string[] }).roles).toEqual(["developer", "viewer"]);
    expect((await whoami(session)).status).toBe(200);
    const removed = await gateway()(
      new Request(
        `${ORIGIN}/console-api/api/members/${grace.id}`,
        json("DELETE", undefined, admin),
      ),
    );
    expect(removed.status).toBe(204);
    expect((await whoami(session)).status).toBe(401);
    // She may join again by domain: the way to keep her out is the domain list.
    expect(await registry.findMemberByEmail("acme", "grace@acme.fr")).toBeUndefined();
  });

  it("is not for non-admins, and keeps the last administrator", async () => {
    const dev = await signIn("ada@external.test", "192.0.2.28");
    const denied = await gateway()(
      new Request(
        `${ORIGIN}/console-api/api/invitations`,
        json("POST", { email: "x@y.test", roles: ["admin"] }, dev),
      ),
    );
    expect(denied.status).toBe(403);
    const root = (await registry.findMemberByEmail("acme", "root@acme.fr"))!;
    const demote = await gateway()(
      new Request(
        `${ORIGIN}/console-api/api/members/${root.id}`,
        json("PATCH", { roles: [] }, admin),
      ),
    );
    expect(demote.status).toBe(409);
    const remove = await gateway()(
      new Request(`${ORIGIN}/console-api/api/members/${root.id}`, json("DELETE", undefined, admin)),
    );
    expect(remove.status).toBe(409);
    // Writes must be JSON.
    const form415 = await gateway()(
      new Request(`${ORIGIN}/console-api/api/invitations`, {
        method: "POST",
        headers: { cookie: admin, "content-type": "text/plain" },
        body: JSON.stringify({ email: "z@y.test", roles: [] }),
      }),
    );
    expect(form415.status).toBe(415);
  });
});

const decode = (text: string) =>
  text.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");

/** Presses a button of the CLI confirmation page: what the page hands back to the CLI. */
async function answer(
  gateway: (request: Request) => Promise<Response>,
  confirmation: Response,
  cookie: string,
  origin: string,
  decision: "allow" | "deny" = "allow",
) {
  const html = await confirmation.text();
  const fields = new URLSearchParams(
    [...html.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)">/g)].map(
      (m): [string, string] => [decode(m[1]!), decode(m[2]!)],
    ),
  );
  fields.set("decision", decision);
  const posted = await gateway(
    new Request(`${origin}/auth/cli`, {
      method: "POST",
      headers: { cookie, origin, "content-type": "application/x-www-form-urlencoded" },
      body: fields,
    }),
  );
  const refresh = /http-equiv="refresh" content="0;url=([^"]+)"/.exec(await posted.clone().text());
  return { status: posted.status, location: refresh ? decode(refresh[1]!) : undefined };
}

describe("forgeron login through the email sign-in", () => {
  it("goes sign-in page, code, session, then back to the CLI's own page", async () => {
    const redirect = "http://127.0.0.1:43111/callback";
    const cli = `/auth/cli?${new URLSearchParams({
      redirect_uri: redirect,
      state: "s",
      code_challenge: "c".repeat(43),
      code_challenge_method: "S256",
    })}`;
    const first = await gateway()(new Request(`${ORIGIN}${cli}`));
    expect(first.status).toBe(302);
    const login = first.headers.get("location")!;
    expect(login.startsWith("/auth/login?next=")).toBe(true);
    const page = await gateway()(new Request(`${ORIGIN}${login}`));
    expect(await page.text()).toContain(`name="next"`);
    const next = new URL(login, ORIGIN).searchParams.get("next")!;
    const asked = await requestCode("root@acme.fr", { ip: "192.0.2.30", next });
    const done = await verify(lastCode(), cookiesOf(asked));
    expect(done.headers.get("location")).toBe(cli);
    const back = await gateway()(
      new Request(`${ORIGIN}${done.headers.get("location")}`, {
        headers: { cookie: cookiesOf(done) },
      }),
    );
    expect(back.status).toBe(200);
    const handed = await answer(gateway(), back, cookiesOf(done), ORIGIN);
    expect(handed.location).toMatch(/^http:\/\/127\.0\.0\.1:43111\/callback\?code=/);
  });
});

describe("beside OpenID Connect", () => {
  const oidc = { OIDC_ISSUER: "https://idp.example.test", OIDC_CLIENT_ID: "forgeron" };

  it("offers the company account first, then the email form", async () => {
    const page = await (
      await gateway({ ...oidc, SIGN_IN_METHODS: "oidc,email" })(new Request(`${ORIGIN}/auth/login`))
    ).text();
    expect(page.indexOf("company account")).toBeGreaterThan(-1);
    expect(page.indexOf("company account")).toBeLessThan(page.indexOf('name="email"'));
    const idp = await simulatedProvider("root@acme.fr", clock);
    const start = await gateway(
      { ...oidc, SIGN_IN_METHODS: "oidc,email" },
      idp.fetcher,
    )(new Request(`${ORIGIN}/auth/login?method=oidc`));
    expect(start.status).toBe(302);
    expect(start.headers.get("location")).toContain("idp.example.test");
  });

  it("with email alone the provider's callback is not offered", async () => {
    const response = await gateway({ ...oidc })(
      new Request(`${ORIGIN}/auth/callback?code=x&state=y`),
    );
    expect(response.status).toBe(404);
  });

  it("with OIDC alone, and no sign-in methods stated, the old behaviour stands", async () => {
    const idp = await simulatedProvider("root@acme.fr", clock);
    const plain = { ...env, ...oidc };
    delete plain.SIGN_IN_METHODS;
    const start = await createGateway(plain, { now: () => clock, mail, fetch: idp.fetcher })(
      new Request(`${ORIGIN}/auth/login`),
    );
    expect(start.status).toBe(302);
    const email = await createGateway(plain, { now: () => clock, mail })(
      new Request(`${ORIGIN}/auth/email/request`, form({ email: "root@acme.fr" })),
    );
    expect(email.status).toBe(404);
  });

  it("the same person by email and by provider is one member; an invitation is accepted either way", async () => {
    const both = { ...oidc, SIGN_IN_METHODS: "oidc,email" };
    const byEmail = (await registry.findMemberByEmail("acme", "root@acme.fr"))!;
    const idp = await simulatedProvider("root@acme.fr", clock);
    const gw = gateway(both, idp.fetcher);
    const login = await gw(new Request(`${ORIGIN}/auth/login?method=oidc`));
    const callback = await gw(
      new Request(`${ORIGIN}/auth/callback${idp.signIn(login.headers.get("location")!)}`, {
        headers: { cookie: cookiesOf(login) },
      }),
    );
    expect(callback.status).toBe(302);
    const me = (await (await whoami(cookiesOf(callback))).json()) as { id: string };
    expect(me.id).toBe(byEmail.id);

    await registry.inviteMember("acme", {
      email: "olga@acme.fr",
      roles: ["developer"],
      invitedBy: byEmail.id,
      expiresAt: new Date(clock.getTime() + 100000),
    });
    const idp2 = await simulatedProvider("olga@acme.fr", clock);
    const gw2 = gateway(both, idp2.fetcher);
    const login2 = await gw2(new Request(`${ORIGIN}/auth/login?method=oidc`));
    const callback2 = await gw2(
      new Request(`${ORIGIN}/auth/callback${idp2.signIn(login2.headers.get("location")!)}`, {
        headers: { cookie: cookiesOf(login2) },
      }),
    );
    expect(callback2.status).toBe(302);
    expect(
      ((await (await whoami(cookiesOf(callback2))).json()) as { roles: string[] }).roles,
    ).toEqual(["developer", "member"]);
  });

  it("answers 404 for the email routes when email sign-in is not on", async () => {
    const off = { ...env, SIGN_IN_METHODS: "oidc" };
    const response = await createGateway(off, { now: () => clock, mail })(
      new Request(`${ORIGIN}/auth/email/request`, form({ email: "root@acme.fr" })),
    );
    expect(response.status).toBe(404);
  });
});

describe("console mail mode (D-051)", () => {
  const consoleEnv = { MAIL_MODE: "console" } as Partial<GatewayEnv>;
  const gw = (over: Partial<GatewayEnv>, lines: string[]) => {
    const log = vi
      .spyOn(console, "log")
      .mockImplementation((line: string) => void lines.push(line));
    return { gateway: createGateway({ ...env, ...over }, { now: () => clock }), log };
  };

  it("logs the code for the first administrator, who signs in with it; the answer is the same for a stranger", async () => {
    const lines: string[] = [];
    const { gateway: g, log } = gw({ ...consoleEnv, BASE_DOMAIN: "example.com" }, lines);
    const origin = "https://acme.example.com";
    const ask = (email: string) =>
      g(new Request(`${origin}/auth/email/request`, form({ email }, { origin })));
    const known = await ask("root@acme.fr");
    const stranger = await ask("stranger@elsewhere.test");
    expect(await anonymous(stranger, "stranger@elsewhere.test")).toBe(
      await anonymous(known, "root@acme.fr"),
    );
    // One line, for the allowed address only.
    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]!) as { event: string; address: string; code: string };
    expect(entry).toMatchObject({ event: "sign-in code", address: "root@acme.fr" });
    expect(entry.code).toMatch(/^\d{8}$/);
    expect(lines.join("")).not.toContain("stranger");
    const done = await g(
      new Request(
        `${origin}/auth/email/verify`,
        form({ code: entry.code }, { origin, cookie: cookiesOf(known) }),
      ),
    );
    expect(done.status).toBe(303);
    log.mockRestore();
  });

  it("says on the sign-in page that it is for tests", async () => {
    const { gateway: g, log } = gw({ ...consoleEnv, BASE_DOMAIN: "example.com" }, []);
    const page = await (await g(new Request("https://acme.example.com/auth/login"))).text();
    expect(page).toContain("Test mode");
    log.mockRestore();
  });

  it("logs an invitation (address and roles), never a code", async () => {
    const lines: string[] = [];
    const { gateway: g, log } = gw({ ...consoleEnv, BASE_DOMAIN: "example.com" }, lines);
    const origin = "https://acme.example.com";
    const asked = await g(
      new Request(`${origin}/auth/email/request`, form({ email: "root@acme.fr" }, { origin })),
    );
    const entry = JSON.parse(lines[0]!) as { code: string };
    const done = await g(
      new Request(
        `${origin}/auth/email/verify`,
        form({ code: entry.code }, { origin, cookie: cookiesOf(asked) }),
      ),
    );
    lines.length = 0;
    const invited = await g(
      new Request(
        `${origin}/console-api/api/invitations`,
        json("POST", { email: "new@x.test", roles: ["developer"] }, cookiesOf(done)),
      ),
    );
    expect(invited.status).toBe(201);
    expect(lines.map((l) => JSON.parse(l))).toEqual([
      { event: "invitation", address: "new@x.test", roles: ["developer"] },
    ]);
    log.mockRestore();
  });

  it("is refused on the cloud: no email sign-in at all, and an error in the logs", async () => {
    const lines: string[] = [];
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { gateway: g, log } = gw(consoleEnv, lines);
    const response = await g(
      new Request(`${ORIGIN}/auth/email/request`, form({ email: "root@acme.fr" })),
    );
    expect(response.status).toBe(404);
    expect(lines).toEqual([]);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
    log.mockRestore();
  });

  it("without MAIL_MODE and without a sender, email sign-in stays off", async () => {
    const response = await createGateway(env, { now: () => clock })(
      new Request(`${ORIGIN}/auth/email/request`, form({ email: "root@acme.fr" })),
    );
    expect(response.status).toBe(404);
  });
});
