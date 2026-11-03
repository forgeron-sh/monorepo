import type { EmailCodes, Member, Registry } from "@forgeron/registry";
import { workspaceOf } from "../dispatch/dispatch";
import type { MailSender } from "../mail/mail";
import { safeNext } from "./auth";
import { seal, toBase64Url, unseal } from "./sealed";
import { cookieOf, openSession } from "./session";

// Passwordless sign-in by email (D-049), beside the OpenID Connect provider:
//   GET  /auth/login           the sign-in page (email form; the OIDC button first when both are on)
//   POST /auth/email/request   an address in, the same answer out whether or not it may sign in
//   GET  /auth/email/verify    the form for the code
//   POST /auth/email/verify    the code in, the same session as any provider out
// Nothing is stored in the clear and nothing is mailed to an address that is not allowed in.

const COOKIE = "__Host-fg_email";
const PREFIX = "fge";
const CODE_DIGITS = 8;
const CODE_SECONDS = 10 * 60;
const MAX_ATTEMPTS = 5;
/** Requests per address and per source address in an hour. The same whoever the address is. */
const PER_EMAIL = 5;
const PER_IP = 20;
const WINDOW_SECONDS = 60 * 60;
const EMAIL =
  /^[^\s@<>"',;:\\()[\]]{1,64}@[^\s@<>"',;:\\()[\]]{1,255}\.[^\s@<>"',;:\\()[\]]{2,63}$/;

const encoder = new TextEncoder();

interface EmailPolicy {
  /** This email becomes an administrator the first time it signs in (`--admin-email`). */
  adminEmail?: string;
  /** Emails of these domains join by themselves. */
  domains: string[];
  /** The role they join with; none when `undefined`. */
  defaultRole?: string;
}

export interface EmailAuthOptions {
  baseDomain: string;
  secret: string;
  registry: Registry;
  codes: EmailCodes;
  mail: MailSender;
  policy(workspace: string): Promise<EmailPolicy>;
  /** Whether the workspace also has an OIDC provider that people may use. */
  oidcAvailable(workspace: string): Promise<boolean>;
  now(): Date;
  sessionTtlSeconds: number;
  /**
   * Runs the sending of a mail after the answer has gone (`ctx.waitUntil`), so that an address that
   * gets a mail does not take longer to answer than one that does not. Without it the mail is
   * awaited.
   */
  defer?(work: Promise<unknown>): void;
}

type Admission =
  | { kind: "member"; member: Member }
  | { kind: "invitation"; roles: string[] }
  | { kind: "admin-email"; roles: string[] }
  | { kind: "domain"; roles: string[] };

const CSP =
  "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";

const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

const page = (status: number, title: string, body: string, headers: Record<string, string> = {}) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:24rem;margin:4rem auto;padding:0 1rem}input,button{font:inherit;padding:.5rem;width:100%;box-sizing:border-box;margin:.25rem 0}button{cursor:pointer}.or{text-align:center;color:#666;margin:1rem 0}.error{color:#b00020}a.button{display:block;text-align:center;padding:.5rem;border:1px solid #888;border-radius:4px;text-decoration:none;color:inherit}</style></head><body><h1>${escape(title)}</h1>${body}</body></html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": CSP,
        "cache-control": "no-store",
        "referrer-policy": "no-referrer",
        "x-content-type-options": "nosniff",
        ...headers,
      },
    },
  );

const hidden = (next: string | undefined) =>
  next ? `<input type="hidden" name="next" value="${escape(next)}">` : "";

const emailForm = (next: string | undefined, message?: string) =>
  `${message ? `<p class="error" role="alert">${escape(message)}</p>` : ""}<form method="post" action="/auth/email/request">${hidden(next)}<label>Email<input name="email" type="email" autocomplete="email" required autofocus></label><button type="submit">Send me a code</button></form>`;

const codeForm = (message?: string) =>
  `${message ? `<p class="error" role="alert">${escape(message)}</p>` : ""}<form method="post" action="/auth/email/verify"><label>Code<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 \\-]*" required autofocus></label><button type="submit">Sign in</button></form><p><a href="/auth/login">Use another address</a></p>`;

const cookie = (value: string, maxAge: number) =>
  `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

const hmacHex = async (secret: string, data: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
  return Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
};

/** Compares two strings in time that depends on their length only. */
const sameText = (a: string, b: string): boolean => {
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
};

/** A uniformly random code of `CODE_DIGITS` digits (no modulo bias). */
function newCode(): string {
  const space = 10 ** CODE_DIGITS;
  const limit = 2 ** 32 - (2 ** 32 % space);
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer);
  while (buffer[0]! >= limit);
  return String(buffer[0]! % space).padStart(CODE_DIGITS, "0");
}

const groups = (code: string) => `${code.slice(0, CODE_DIGITS / 2)} ${code.slice(CODE_DIGITS / 2)}`;

export function createEmailAuth(options: EmailAuthOptions) {
  const { registry, codes, secret } = options;

  /** Who this address would be, without making them a member. */
  async function admission(workspace: string, email: string): Promise<Admission | undefined> {
    const policy = await options.policy(workspace);
    const [member, invitation] = await Promise.all([
      registry.findMemberByEmail(workspace, email),
      registry.findInvitation(workspace, email),
    ]);
    if (member) return { kind: "member", member };
    if (invitation) return { kind: "invitation", roles: invitation.roles };
    if (policy.adminEmail && email === policy.adminEmail.toLowerCase()) {
      return { kind: "admin-email", roles: ["admin"] };
    }
    if (policy.domains.includes(email.split("@")[1] ?? "")) {
      return { kind: "domain", roles: policy.defaultRole ? [policy.defaultRole] : [] };
    }
    return undefined;
  }

  const admit = async (workspace: string, email: string, found: Admission): Promise<Member> =>
    found.kind === "member"
      ? found.member
      : registry.joinMember({ workspace, email, roles: found.roles, via: found.kind });

  return async function emailAuth(request: Request): Promise<Response | undefined> {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path !== "/auth/login" && !path.startsWith("/auth/email/")) return undefined;
    const workspace = workspaceOf(url.host, options.baseDomain);
    if (!workspace) return undefined;
    const method = request.method;

    if (path === "/auth/login") {
      // The OIDC provider keeps its own start (`?method=oidc`) and the old behaviour when it is alone.
      if (url.searchParams.get("method") === "oidc") return undefined;
      const oidc = await options.oidcAvailable(workspace);
      if (method !== "GET") return page(405, "Not allowed", "", { allow: "GET" });
      const next = safeNext(url.searchParams.get("next"));
      const choose = oidc
        ? `<a class="button" href="/auth/login?method=oidc${next ? `&amp;next=${encodeURIComponent(next).replaceAll("&", "%26")}` : ""}">Continue with your company account</a><p class="or">or</p>`
        : "";
      return page(200, "Sign in", `${choose}${emailForm(next)}`);
    }

    if (path !== "/auth/email/request" && path !== "/auth/email/verify") return undefined;

    if (method === "GET" && path === "/auth/email/verify") {
      return page(200, "Enter your code", codeForm());
    }
    if (method !== "POST") return page(405, "Not allowed", "", { allow: "POST" });
    // A form post comes from this very page: a request from another origin is refused outright, so a
    // third-party page cannot sign a person in to someone else's account or burn their tries.
    if (request.headers.get("origin") !== url.origin) {
      return page(403, "Not allowed", "<p>This request did not come from the sign-in page.</p>");
    }
    const form = await request.formData().catch(() => undefined);
    if (!form) return page(400, "Sign in", emailForm(undefined, "That request was not valid."));
    const field = (name: string) => {
      const value = form.get(name);
      return typeof value === "string" ? value : "";
    };

    if (path === "/auth/email/request") {
      const next = safeNext(field("next"));
      const email = field("email").trim().toLowerCase();
      if (email.length > 254 || !EMAIL.test(email)) {
        return page(400, "Sign in", emailForm(next, "Enter a valid email address."));
      }
      const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
      const ipHash = await hmacHex(secret, `ip:${workspace}:${ip}`);
      // Counted the same for every address: the limit says nothing about the account.
      const [byEmail, byIp] = await Promise.all([
        codes.countRecent(workspace, { email }, WINDOW_SECONDS),
        codes.countRecent(workspace, { ipHash }, WINDOW_SECONDS),
      ]);
      if (byEmail >= PER_EMAIL || byIp >= PER_IP) {
        return page(
          429,
          "Too many requests",
          "<p>Too many codes were asked for. Try again in an hour.</p>",
          { "retry-after": String(WINDOW_SECONDS) },
        );
      }
      const found = await admission(workspace, email);
      const id = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
      const code = newCode();
      // A row exists whether or not a mail goes: what is stored, and how long it takes, is the same.
      await codes.create({
        id,
        workspace,
        email,
        codeHash: await hmacHex(secret, `code:${id}:${code}`),
        ipHash,
        ttlSeconds: CODE_SECONDS,
      });
      if (found) {
        const sending = options.mail
          .send({
            to: email,
            subject: "Your sign-in code",
            text: `Your code to sign in to ${workspace} is ${groups(code)}.\n\nIt works once, for ${CODE_SECONDS / 60} minutes, in the browser where you asked for it. If you did not ask for it, ignore this message: nobody can sign in without it.`,
          })
          // The answer must not tell a failed send from no send: log it, without the address.
          .catch((error: unknown) => {
            console.error("sign-in mail not sent:", error instanceof Error ? error.name : "error");
          });
        if (options.defer) options.defer(sending);
        else await sending;
      }
      const exp = Math.floor(options.now().getTime() / 1000) + CODE_SECONDS;
      return page(
        200,
        "Enter your code",
        `<p>If this address can sign in, a code is on its way. It is valid for ${CODE_SECONDS / 60} minutes.</p>${codeForm()}`,
        {
          "set-cookie": cookie(
            await seal(PREFIX, { rid: id, ws: workspace, exp, ...(next ? { next } : {}) }, secret),
            CODE_SECONDS,
          ),
        },
      );
    }

    // POST /auth/email/verify
    const refuse = () =>
      page(400, "Enter your code", codeForm("This code is not valid, or it has expired."));
    const kept = cookieOf(request, COOKIE);
    const claims = kept ? await unseal(PREFIX, kept, secret) : undefined;
    if (
      !claims ||
      claims.ws !== workspace ||
      typeof claims.rid !== "string" ||
      typeof claims.exp !== "number" ||
      options.now().getTime() / 1000 >= claims.exp
    ) {
      return refuse();
    }
    const code = field("code").replace(/[\s-]/g, "");
    if (!new RegExp(`^[0-9]{${CODE_DIGITS}}$`).test(code)) return refuse();
    const row = await codes.attempt(claims.rid, workspace, MAX_ATTEMPTS);
    if (!row) return refuse();
    const given = await hmacHex(secret, `code:${claims.rid}:${code}`);
    if (!sameText(given, row.codeHash)) return refuse();
    // Single use: only the caller that spends it gets in.
    if (!(await codes.spend(claims.rid))) return refuse();
    const found = await admission(workspace, row.email);
    if (!found) return refuse();
    const member = await admit(workspace, row.email, found);

    // A new session every time: whatever cookie the browser held is not reused (no fixation).
    const headers = new Headers({
      location: safeNext(typeof claims.next === "string" ? claims.next : undefined) ?? "/",
    });
    headers.append(
      "set-cookie",
      await openSession(
        { person: member.id, workspace },
        { secret, ttlSeconds: options.sessionTtlSeconds, now: options.now() },
      ),
    );
    headers.append("set-cookie", cookie("", 0));
    headers.set("cache-control", "no-store");
    return new Response(null, { status: 303, headers });
  };
}
