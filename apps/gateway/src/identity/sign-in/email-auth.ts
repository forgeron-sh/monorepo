import type { EmailCodes, Member, Registry } from "@forgeron/registry";
import type { MailSender } from "../../mail/mail";
import { errorPage } from "../../pages/errors";
import { reasonOf, signInPages } from "../../pages/sign-in";
import { safeNext } from "./auth";
import { findInvitationById } from "./invitation";
import { sameOriginPost } from "../authn/origin";
import { seal, toBase64Url, unseal } from "../authn/sealed";
import { cookieOf, openSession } from "../authn/session";

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
  /** The workspace a host serves (D-126). Sign-in by email works on any host the gateway serves. */
  workspaceOf(host: string): string | undefined;
  secret: string;
  registry: Pick<
    Registry,
    "findInvitation" | "findMember" | "findMemberByEmail" | "joinMember" | "listInvitations"
  >;
  codes: EmailCodes;
  mail: MailSender;
  policy(workspace: string): Promise<EmailPolicy>;
  /** Whether the workspace also has an OIDC provider that people may use. */
  oidcAvailable(workspace: string): Promise<boolean>;
  now(): Date;
  sessionTtlSeconds: number;
  /** A line shown on the sign-in pages (the console mail mode says it is for tests). */
  notice?: string;
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
    const invite = /^\/auth\/invite\/([^/]+)$/.exec(path);
    if (path !== "/auth/login" && !path.startsWith("/auth/email/") && !invite) return undefined;
    const workspace = options.workspaceOf(url.host);
    if (!workspace) return undefined;
    const method = request.method;
    const pages = signInPages(workspace, {
      codeMinutes: CODE_SECONDS / 60,
      digits: CODE_DIGITS,
      ...(options.notice ? { testNotice: options.notice } : {}),
    });

    if (invite) {
      if (method !== "GET") return errorPage(405, { workspace, headers: { allow: "GET" } });
      // The id opens this page and nothing else: the code mailed to the address is still the way in.
      const found = await findInvitationById(registry, secret, workspace, invite[1]!);
      if (!found) return pages.invitationInvalid();
      return pages.invitation({
        inviter: found.inviter,
        roles: found.invitation.roles,
        email: found.invitation.email,
        expiresAt: found.invitation.expiresAt,
        next: undefined,
      });
    }

    if (path === "/auth/login") {
      // The OIDC provider keeps its own start (`?method=oidc`) and the old behaviour when it is alone.
      if (url.searchParams.get("method") === "oidc") return undefined;
      const oidc = await options.oidcAvailable(workspace);
      if (method !== "GET") return errorPage(405, { workspace, headers: { allow: "GET" } });
      const next = safeNext(url.searchParams.get("next"));
      const reason = reasonOf(url.searchParams.get("reason"));
      return pages.login({
        next,
        ...(oidc
          ? {
              companyHref: `/auth/login?method=oidc${next ? `&next=${encodeURIComponent(next).replaceAll("&", "%26")}` : ""}`,
            }
          : {}),
        ...(reason ? { reason } : {}),
      });
    }

    if (path !== "/auth/email/request" && path !== "/auth/email/verify") return undefined;

    if (method === "GET" && path === "/auth/email/verify") {
      // The address typed on the previous step travels in the sealed cookie, for the resend link.
      const kept = cookieOf(request, COOKIE);
      const claims = kept ? await unseal(PREFIX, kept, secret) : undefined;
      const mine = claims && claims.ws === workspace;
      return pages.code({
        email: mine && typeof claims.em === "string" ? claims.em : undefined,
        next: mine
          ? safeNext(typeof claims.next === "string" ? claims.next : undefined)
          : undefined,
      });
    }
    if (method !== "POST") return errorPage(405, { workspace, headers: { allow: "POST" } });
    // A form post comes from this very page: a request from another origin is refused outright, so a
    // third-party page cannot sign a person in to someone else's account or burn their tries.
    if (!sameOriginPost(request)) return pages.refused();
    const form = await request.formData().catch(() => undefined);
    if (!form)
      return pages.login({
        next: undefined,
        message: "That request was not valid. Try again.",
        status: 400,
      });
    const field = (name: string) => {
      const value = form.get(name);
      return typeof value === "string" ? value : "";
    };

    if (path === "/auth/email/request") {
      const next = safeNext(field("next"));
      const email = field("email").trim().toLowerCase();
      if (email.length > 254 || !EMAIL.test(email)) {
        return pages.login({
          next,
          message: "That is not an email address. Enter one like name@company.com.",
          status: 400,
        });
      }
      const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
      const ipHash = await hmacHex(secret, `ip:${workspace}:${ip}`);
      // Counted the same for every address: the limit says nothing about the account.
      const [byEmail, byIp] = await Promise.all([
        codes.countRecent(workspace, { email }, WINDOW_SECONDS),
        codes.countRecent(workspace, { ipHash }, WINDOW_SECONDS),
      ]);
      if (byEmail >= PER_EMAIL || byIp >= PER_IP) return pages.tooMany(WINDOW_SECONDS);
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
            code,
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
      return pages.code({
        email,
        next,
        sent: true,
        headers: {
          "set-cookie": cookie(
            await seal(
              PREFIX,
              { rid: id, ws: workspace, em: email, exp, ...(next ? { next } : {}) },
              secret,
            ),
            CODE_SECONDS,
          ),
        },
      });
    }

    // POST /auth/email/verify
    const kept = cookieOf(request, COOKIE);
    const claims = kept ? await unseal(PREFIX, kept, secret) : undefined;
    const again = {
      email: typeof claims?.em === "string" ? claims.em : undefined,
      next: safeNext(typeof claims?.next === "string" ? claims.next : undefined),
      status: 400,
    };
    // The same words whether the code was wrong, spent or never asked for here.
    const wrong = () =>
      pages.code({
        ...again,
        message: "That code is not correct. Check the email and try again, or send a new code.",
      });
    const gone = () =>
      pages.code({
        ...again,
        message: "This code expired or is no longer valid. Send a new code.",
      });
    if (
      !claims ||
      claims.ws !== workspace ||
      typeof claims.rid !== "string" ||
      typeof claims.exp !== "number" ||
      options.now().getTime() / 1000 >= claims.exp
    ) {
      return gone();
    }
    const code = field("code").replace(/[\s-]/g, "");
    if (!new RegExp(`^[0-9]{${CODE_DIGITS}}$`).test(code)) {
      return pages.code({
        ...again,
        message: `Enter the ${CODE_DIGITS}-digit code from the email.`,
      });
    }
    const row = await codes.attempt(claims.rid, workspace, MAX_ATTEMPTS);
    if (!row) return gone();
    const given = await hmacHex(secret, `code:${claims.rid}:${code}`);
    if (!sameText(given, row.codeHash)) return wrong();
    // Single use: only the caller that spends it gets in.
    if (!(await codes.spend(claims.rid))) return gone();
    const found = await admission(workspace, row.email);
    if (!found) return wrong();
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
