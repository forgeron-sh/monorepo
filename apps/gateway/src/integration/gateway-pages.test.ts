import type { D1Database } from "@forgeron/hosting";
import { migratePlatform } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { memoryMailSender } from "../mail/mail";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The pages the gateway serves, as a browser sees them: one shell, every step of the sign-in, the
// invitation landing and the CLI confirmation (FOR-128, D-053).

const ORIGIN = "https://acme.forgeron.app";
const CSP =
  "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";
let clock = new Date("2026-11-03T10:00:00Z");
let memory: MemoryD1;
let env: GatewayEnv;
const mail = memoryMailSender();

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  env = {
    DB: d1,
    BASE_DOMAIN: "forgeron.app",
    AUTH_SECRET: "test-secret-not-a-real-one",
    ADMIN_EMAIL: "root@acme.fr",
    SIGN_IN_METHODS: "email",
  };
});
afterAll(() => memory.close());
beforeEach(async () => {
  clock = new Date("2026-11-03T10:00:00Z");
  await memory.exec(`DELETE FROM "email_codes"`);
});

const gateway = () => createGateway(env, { now: () => clock, mail });
const form = (fields: Record<string, string>, extra: Record<string, string> = {}) => ({
  method: "POST",
  headers: { origin: ORIGIN, "content-type": "application/x-www-form-urlencoded", ...extra },
  body: new URLSearchParams(fields),
});
const cookiesOf = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0]!)
    .filter((c) => !c.endsWith("="))
    .join("; ");
const lastCode = () => /(\d{4}) (\d{4})/.exec(mail.sent.at(-1)!.text)!.slice(1, 3).join("");
const get = (path: string, headers: Record<string, string> = {}) =>
  gateway()(new Request(`${ORIGIN}${path}`, { headers }));
const ask = (email: string, ip = "203.0.113.50", extra: Record<string, string> = {}) =>
  gateway()(
    new Request(
      `${ORIGIN}/auth/email/request`,
      form({ email, ...extra }, { "cf-connecting-ip": ip }),
    ),
  );
const verify = (code: string, cookie: string) =>
  gateway()(new Request(`${ORIGIN}/auth/email/verify`, form({ code }, { cookie })));
async function signIn(email: string, ip: string) {
  const asked = await ask(email, ip);
  const done = await verify(lastCode(), cookiesOf(asked));
  expect(done.status).toBe(303);
  return cookiesOf(done);
}

/** What every page of the shell has in common. */
async function expectShell(response: Response) {
  const html = await response.text();
  expect(response.headers.get("content-type")).toContain("text/html");
  expect(response.headers.get("content-security-policy")).toBe(CSP);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(html).toMatch(/^<!doctype html><html lang="en">/);
  expect(html).toContain('<meta name="viewport" content="width=device-width,initial-scale=1">');
  expect(html).toMatch(/<title>[^<]+ · Forgeron<\/title>/);
  expect(html.match(/<h1>/g)).toHaveLength(1);
  expect(html).toContain("<main>");
  // No script, no handler, no request to anything else: the CSP allows none of it.
  expect(html).not.toMatch(/<script|<link|<img|<iframe|\son[a-z]+=|url\(|@import|https?:\/\/fonts/);
  // The design system: Forge by default, Atelier by `prefers-color-scheme`, no rounding.
  expect(html).toContain("--bg:#1c1c1c");
  expect(html).toContain(
    "@media (prefers-color-scheme:light){:root{color-scheme:light;--bg:#ffffff",
  );
  expect(html).not.toMatch(/border-radius:(?!0)/);
  return html;
}

describe("the page shell", () => {
  it("dresses the sign-in page from the design tokens", async () => {
    const html = await expectShell(await get("/auth/login"));
    expect(html).toContain("<title>Sign in to acme · Forgeron</title>");
    expect(html).toContain('<form method="post" action="/auth/email/request"');
    expect(html).toMatch(
      /<label for="email">Email<\/label><input id="email" name="email" type="email"/,
    );
    expect(html).toContain("Send me a code");
    expect(html).toContain("width:100%;height:32px");
  });

  it("says why the person is back: expired session, signed out", async () => {
    const expired = await expectShell(await get("/auth/login?reason=expired"));
    expect(expired).toContain("Your session expired. Sign in again to continue.");
    const out = await expectShell(await get("/auth/login?reason=signed-out"));
    expect(out).toContain("You are signed out.");
    expect(await (await get("/auth/login?reason=<b>")).text()).not.toContain("<b>");
    // Logging out lands on that page.
    const logout = await get("/auth/logout");
    expect(logout.headers.get("location")).toBe("/auth/login?reason=signed-out");
  });

  it("gives a browser an error page and an API client its JSON", async () => {
    const page = await get("/mcp", { accept: "text/html,application/xhtml+xml" });
    const html = await expectShell(page);
    expect(page.status).toBe(404);
    expect(html).toContain("<h1>This page does not exist</h1>");
    expect(html).toContain("Check the address, or go to the workspace home.");
    expect((await get("/mcp")).headers.get("content-type")).toContain("application/json");
    const post = await gateway()(new Request(`${ORIGIN}/auth/login`, { method: "POST" }));
    expect(post.status).toBe(405);
    expect(post.headers.get("allow")).toBe("GET");
    expect(await expectShell(post)).toContain("This method is not allowed");
    const cross = await gateway()(
      new Request(
        `${ORIGIN}/auth/email/request`,
        form({ email: "a@b.test" }, { origin: "https://evil.test" }),
      ),
    );
    expect(cross.status).toBe(403);
    expect(await expectShell(cross)).toContain("You do not have access");
  });

  it("answers a failure of the gateway with a 500 page that tells nothing", async () => {
    const { default: worker } = await import("../index");
    const failing = {
      prepare: () => {
        throw new Error("storage secret detail");
      },
    };
    // Test mail mode (D-051) turns the email sign-in on without a mail binding.
    const broken = {
      ...env,
      DB: failing,
      MAIL_MODE: "console",
      BASE_DOMAIN: "fabriks.cc",
    } as unknown as GatewayEnv;
    const origin = "https://acme.fabriks.cc";
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await worker.fetch(
      new Request(`${origin}/auth/email/request`, {
        ...form({ email: "root@acme.fr" }),
        headers: { ...form({}, { origin }).headers, accept: "text/html" },
      }),
      broken,
      { waitUntil: () => {} },
    );
    expect(response.status).toBe(500);
    const html = await expectShell(response);
    expect(html).toContain("<h1>Something went wrong</h1>");
    expect(html).not.toContain("storage secret detail");
    expect(JSON.stringify(log.mock.calls)).not.toContain("storage secret detail");
    log.mockRestore();
  });
});

describe("the sign-in steps", () => {
  it("asks for the code in one paste-friendly field, and can send another", async () => {
    const asked = await ask("root@acme.fr", "203.0.113.51");
    const html = await expectShell(asked);
    expect(asked.status).toBe(200);
    expect(html).toContain("Enter your code");
    expect(html).toMatch(/<input id="code"[^>]*name="code"/);
    for (const attribute of [
      'inputmode="numeric"',
      'autocomplete="one-time-code"',
      'pattern="[0-9 \\-]*"',
      'maxlength="12"',
    ]) {
      expect(html).toContain(attribute);
    }
    expect(html.match(/name="code"/g)).toHaveLength(1);
    expect(html).toContain("sent an 8-digit code to root@acme.fr");
    // Resend: a second form with the address, nothing secret.
    expect(html).toMatch(
      /action="\/auth\/email\/request">[^]*name="email" value="root@acme.fr"[^]*Send a new code/,
    );
    // The code step can be reloaded from the cookie.
    const again = await get("/auth/email/verify", { cookie: cookiesOf(asked) });
    expect(await again.text()).toContain('value="root@acme.fr"');
    // Pasted with a space or a dash, it works.
    const pasted = `${lastCode().slice(0, 4)} ${lastCode().slice(4)}`;
    expect((await verify(pasted, cookiesOf(asked))).status).toBe(303);
  });

  it("says what went wrong, then what to do, in the same words for everyone", async () => {
    const asked = await ask("root@acme.fr", "203.0.113.52");
    const wrong = await verify("00000000", cookiesOf(asked));
    expect(wrong.status).toBe(400);
    const html = await expectShell(wrong);
    expect(html).toContain('role="alert"');
    expect(html).toContain(
      "That code is not correct. Check the email and try again, or send a new code.",
    );
    const short = await (await verify("123", cookiesOf(asked))).text();
    expect(short).toContain("Enter the 8-digit code from the email.");
    // Too many tries, or too late: the code is gone, send another. Never "n tries left".
    for (let i = 0; i < 5; i++) await verify("11111111", cookiesOf(asked));
    const spent = await (await verify(lastCode(), cookiesOf(asked))).text();
    expect(spent).toContain("This code expired or is no longer valid. Send a new code.");
    const late = await ask("root@acme.fr", "203.0.113.53");
    clock = new Date(clock.getTime() + 11 * 60_000);
    const expired = await (await verify(lastCode(), cookiesOf(late))).text();
    expect(expired).toContain("This code expired or is no longer valid. Send a new code.");
    expect(expired).not.toMatch(/\d+ (tries|attempts) left/);
    const noCookie = await (await verify("12345678", "")).text();
    expect(noCookie).toContain("Send a new code");
  });

  it("explains a bad address and a limit without naming anyone", async () => {
    const bad = await ask("not-an-address", "203.0.113.54");
    expect(bad.status).toBe(400);
    expect(await expectShell(bad)).toContain(
      "That is not an email address. Enter one like name@company.com.",
    );
    let last = new Response();
    for (let i = 0; i < 6; i++) last = await ask("someone@elsewhere.test", `203.0.113.${60 + i}`);
    expect(last.status).toBe(429);
    expect(last.headers.get("retry-after")).toBe("3600");
    expect(await expectShell(last)).toContain("Wait an hour, then ask for a new code.");
  });
});

describe("the invitation landing", () => {
  let admin = "";
  const linkOf = () =>
    /https:\/\/acme\.forgeron\.app(\/auth\/invite\/[A-Za-z0-9_-]+)/.exec(
      mail.sent.at(-1)!.text,
    )?.[1];
  beforeAll(async () => {
    admin = await signIn("root@acme.fr", "203.0.113.70");
  });
  const invite = (email: string, roles: string[]) =>
    gateway()(
      new Request(`${ORIGIN}/console-api/api/invitations`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie: admin },
        body: JSON.stringify({ email, roles }),
      }),
    );

  it("names who invited the person, to which workspace and with which role", async () => {
    expect((await invite("ada@external.test", ["developer"])).status).toBe(201);
    const link = linkOf()!;
    expect(link).toBeDefined();
    // The id says nothing of the address.
    expect(link).not.toContain("ada");
    const landing = await get(link);
    expect(landing.status).toBe(200);
    const html = await expectShell(landing);
    expect(html).toContain("<title>Join acme · Forgeron</title>");
    expect(html).toMatch(/invited you to the acme workspace/);
    expect(html).toMatch(/Role<\/dt><dd>developer/);
    expect(html).toMatch(/Invited by<\/dt><dd>root</);
    expect(html).toContain('value="ada@external.test" readonly');
    // The id alone opens nothing: no cookie is set, and no session comes of it.
    expect(landing.headers.getSetCookie()).toEqual([]);
    expect((await get("/whoami", { cookie: "" })).status).toBe(401);
    // Signing in still takes the code mailed to the address.
    const asked = await gateway()(
      new Request(`${ORIGIN}/auth/email/request`, form({ email: "ada@external.test" })),
    );
    expect(asked.status).toBe(200);
    const done = await verify(lastCode(), cookiesOf(asked));
    expect(done.status).toBe(303);
  });

  it("is the same page for a link that is wrong, expired, withdrawn or replaced", async () => {
    expect((await invite("eve@external.test", ["viewer"])).status).toBe(201);
    const first = linkOf()!;
    expect((await get(first)).status).toBe(200);
    // Inviting again replaces the invitation: the old link stops working.
    clock = new Date(clock.getTime() + 1000);
    expect((await invite("eve@external.test", ["viewer"])).status).toBe(201);
    expect(linkOf()).not.toBe(first);
    const replaced = await get(first);
    const wrongId = await get("/auth/invite/not-a-real-id");
    const guessed = await get(`/auth/invite/${"a".repeat(32)}`);
    expect(replaced.status).toBe(404);
    const html = await expectShell(replaced);
    expect(html).toContain("This invitation is not valid");
    expect(html).not.toContain("eve@external.test");
    expect(await wrongId.text()).toBe(html);
    expect(await guessed.text()).toBe(html);
    // Expired.
    const current = linkOf()!;
    clock = new Date(clock.getTime() + 30 * 24 * 60 * 60 * 1000);
    expect((await get(current)).status).toBe(404);
  });

  it("puts the link in the invitation mail", async () => {
    clock = new Date("2026-11-03T10:00:00Z");
    expect((await invite("grace@external.test", [])).status).toBe(201);
    const message = mail.sent.at(-1)!;
    expect(message).toMatchObject({ to: "grace@external.test" });
    expect(message.text).toMatch(
      /Open https:\/\/acme\.forgeron\.app\/auth\/invite\/[\w-]{32} to accept/,
    );
    expect((await get(linkOf()!)).status).toBe(200);
    expect(await (await get(linkOf()!)).text()).toContain("no role yet");
  });
});

describe("authorizing the CLI", () => {
  const redirect = "http://127.0.0.1:43111/callback";
  const query = new URLSearchParams({
    redirect_uri: redirect,
    state: "st",
    code_challenge: "c".repeat(43),
    code_challenge_method: "S256",
  });
  const path = `/auth/cli?${query}`;
  let session = "";
  beforeAll(async () => {
    session = await signIn("root@acme.fr", "203.0.113.80");
  });
  const post = (fields: Record<string, string>, headers: Record<string, string> = {}) =>
    gateway()(
      new Request(
        `${ORIGIN}/auth/cli`,
        form({ ...Object.fromEntries(query), ...fields }, { cookie: session, ...headers }),
      ),
    );

  it("asks first, naming the loopback address and the person, and hands nothing over", async () => {
    const page = await get(path, { cookie: session });
    expect(page.status).toBe(200);
    expect(page.headers.get("location")).toBeNull();
    const html = await expectShell(page);
    expect(html).toContain("<h1>Authorize the forgeron CLI on 127.0.0.1:43111?</h1>");
    expect(html).toContain("root@acme.fr");
    // Two buttons posting back: no code is in the page, no redirect is in the response.
    expect(html).toContain('<form method="post" action="/auth/cli">');
    expect(html).toMatch(/name="decision" value="deny">Cancel</);
    expect(html).toMatch(/name="decision" value="allow">Authorize</);
    expect(html).not.toContain("code=");
    expect(html).toContain('name="code_challenge_method" value="S256"');
  });

  it("hands the code to the loopback address only after Authorize, by a page and not a redirect", async () => {
    const answered = await post({ decision: "allow" });
    expect(answered.status).toBe(200);
    expect(answered.headers.get("location")).toBeNull();
    const html = await expectShell(answered);
    const url = /http-equiv="refresh" content="0;url=([^"]+)"/
      .exec(html)![1]!
      .replaceAll("&amp;", "&");
    expect(url).toMatch(/^http:\/\/127\.0\.0\.1:43111\/callback\?code=fgc\./);
    expect(new URL(url).searchParams.get("state")).toBe("st");
    expect(html).toContain("Continue to the CLI");
  });

  it("tells the CLI when the person cancels, and gives no code", async () => {
    const answered = await post({ decision: "deny" });
    const html = await expectShell(answered);
    const url = new URL(/url=([^"]+)"/.exec(html)![1]!.replaceAll("&amp;", "&"));
    expect(url.searchParams.get("error")).toBe("access_denied");
    expect(url.searchParams.get("state")).toBe("st");
    expect(url.searchParams.has("code")).toBe(false);
    // Anything but an explicit Authorize is a cancel.
    expect(
      new URL(
        /url=([^"]+)"/.exec(await (await post({})).text())![1]!.replaceAll("&amp;", "&"),
      ).searchParams.has("code"),
    ).toBe(false);
  });

  it("refuses an answer that did not come from the page, or from nobody signed in", async () => {
    const cross = await post({ decision: "allow" }, { origin: "https://evil.test" });
    expect(cross.status).toBe(403);
    expect(await cross.text()).not.toContain("fgc.");
    const noOrigin = await gateway()(
      new Request(`${ORIGIN}/auth/cli`, {
        method: "POST",
        headers: { cookie: session, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ ...Object.fromEntries(query), decision: "allow" }),
      }),
    );
    expect(noOrigin.status).toBe(403);
    const anonymous = await post({ decision: "allow" }, { cookie: "" });
    expect(anonymous.status).toBe(401);
    // The loopback rule still holds on the answer.
    const elsewhere = await post({ decision: "allow", redirect_uri: "http://evil.test/callback" });
    expect(elsewhere.status).toBe(400);
    expect(await elsewhere.text()).not.toContain("evil.test/callback?code");
  });

  it("still sends a signed-out browser to sign in, and says why", async () => {
    const first = await get(path);
    expect(first.status).toBe(302);
    const login = first.headers.get("location")!;
    expect(await (await get(login)).text()).toContain("Sign in to authorize the forgeron CLI.");
  });
});
