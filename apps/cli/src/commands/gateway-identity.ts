import { UsageError } from "../io";

// The identity and key bindings of the gateway Worker that `forgeron platform install` sets
// (docs/self-host.md, "Bindings the gateway reads"; D-030).
//
// - `AUTH_SECRET` and `SECRETS_KEY` are generated here, from the platform's CSPRNG, and never
//   printed. Changing either breaks what exists (sessions and tokens; stored secrets), so an
//   existing one is kept: the new version asks Cloudflare to copy it (`inherit`), no value is sent.
// - The OIDC settings come from flags; the client secret from the environment only.

export type Binding = { type: string; name: string; [key: string]: unknown };

export const KEYS = ["AUTH_SECRET", "SECRETS_KEY"] as const;

/** Flags that state the identity provider and who may sign in. */
export interface IdentityFlags {
  issuer?: string;
  clientId?: string;
  adminEmail?: string;
  memberDomains?: string;
  /** `email`, `oidc` or `email,oidc` (D-048). Without it: the OIDC provider alone, as before. */
  signIn?: string;
  /** The address sign-in mail comes from, on a domain onboarded to Cloudflare Email Sending. */
  mailFrom?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

/** 32 random bytes, base64: the size both keys ask for. */
function generateKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** One setting: the binding to send, whether a previous version may supply it when it is not given. */
export interface Setting {
  name: string;
  /** What to send when the person gave the value (or, for a key, nothing existed to keep). */
  given?: Binding;
  /** Created when no previous version holds it (the keys). */
  generate?: () => Binding;
  /** Asked from the previous version first: it is kept as it is. */
  keep: boolean;
}

/**
 * Checks the flags and the environment and lists the settings. Values are never echoed in errors
 * (the client secret above all).
 */
export function identitySettings(flags: IdentityFlags, env: NodeJS.ProcessEnv): Setting[] {
  const secret = env.OIDC_CLIENT_SECRET;
  const stated = Object.values(flags).some((v) => v !== undefined) || secret !== undefined;
  const settings: Setting[] = KEYS.map((name) => ({
    name,
    keep: true,
    generate: () => ({ type: "secret_text", name, text: generateKey() }),
  }));
  const optional = [
    "OIDC_ISSUER",
    "OIDC_CLIENT_ID",
    "OIDC_CLIENT_SECRET",
    "ADMIN_EMAIL",
    "MEMBER_EMAIL_DOMAINS",
    "SIGN_IN_METHODS",
    "MAIL_FROM",
    "SEND_EMAIL",
  ];
  if (!stated) {
    // Nothing stated: a re-run keeps what the gateway already has instead of silently dropping it.
    return [...settings, ...optional.map((name) => ({ name, keep: true }))];
  }

  const methods =
    flags.signIn === undefined
      ? undefined
      : [...new Set(flags.signIn.split(",").map((m) => m.trim().toLowerCase()))];
  if (methods && (methods.some((m) => m !== "email" && m !== "oidc") || methods.length === 0)) {
    throw new UsageError("--sign-in is email, oidc, or email,oidc.");
  }
  const withEmail = methods?.includes("email") ?? false;
  const withOidc = methods ? methods.includes("oidc") : true;
  if (withEmail && (!flags.mailFrom || !EMAIL.test(flags.mailFrom))) {
    throw new UsageError(
      "--sign-in email needs --mail-from <address>, on a domain onboarded to Cloudflare Email Sending.",
    );
  }
  if (!withEmail && flags.mailFrom !== undefined) {
    throw new UsageError("--mail-from is for --sign-in email.");
  }
  if (withOidc) {
    if (!flags.issuer || !flags.clientId) {
      throw new UsageError(
        "Sign-in needs --oidc-issuer and --oidc-client-id together (the client secret, if any, in OIDC_CLIENT_SECRET).",
      );
    }
    let issuer: URL;
    try {
      issuer = new URL(flags.issuer);
    } catch {
      throw new UsageError("--oidc-issuer must be a URL, such as https://login.example.com.");
    }
    if (issuer.protocol !== "https:" || issuer.search || issuer.hash) {
      throw new UsageError("--oidc-issuer must be an https URL with no query or fragment.");
    }
    if (!/^\S+$/.test(flags.clientId)) {
      throw new UsageError("--oidc-client-id must not be empty or contain spaces.");
    }
    if (secret !== undefined && !/^\S+$/.test(secret)) {
      throw new UsageError("OIDC_CLIENT_SECRET must not be empty or contain spaces.");
    }
  } else if (flags.issuer !== undefined || flags.clientId !== undefined || secret !== undefined) {
    throw new UsageError(
      "--oidc-issuer, --oidc-client-id and OIDC_CLIENT_SECRET are for --sign-in oidc.",
    );
  }
  const domains = (flags.memberDomains ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  if (flags.memberDomains !== undefined && domains.length === 0) {
    throw new UsageError("--member-email-domains is empty: give domains such as acme.fr,acme.com.");
  }
  if (domains.some((d) => !DOMAIN.test(d))) {
    throw new UsageError("--member-email-domains must be comma-separated domains.");
  }
  if (flags.adminEmail !== undefined && !EMAIL.test(flags.adminEmail)) {
    throw new UsageError("--admin-email must be an email address.");
  }
  if (!flags.adminEmail && domains.length === 0) {
    throw new UsageError(
      "Nobody could sign in: give --admin-email, --member-email-domains, or both.",
    );
  }

  const plain = (name: string, text: string): Setting => ({
    name,
    keep: false,
    given: { type: "plain_text", name, text },
  });
  return [
    ...settings,
    ...(methods ? [plain("SIGN_IN_METHODS", methods.join(","))] : []),
    ...(withEmail
      ? [
          plain("MAIL_FROM", flags.mailFrom!),
          // The binding of Cloudflare Email Sending the gateway sends the codes through.
          { name: "SEND_EMAIL", keep: false, given: { type: "send_email", name: "SEND_EMAIL" } },
        ]
      : []),
    ...(withOidc
      ? [plain("OIDC_ISSUER", flags.issuer!), plain("OIDC_CLIENT_ID", flags.clientId!)]
      : []),
    ...(secret === undefined
      ? []
      : [
          {
            name: "OIDC_CLIENT_SECRET",
            keep: false,
            given: { type: "secret_text", name: "OIDC_CLIENT_SECRET", text: secret },
          },
        ]),
    ...(flags.adminEmail ? [plain("ADMIN_EMAIL", flags.adminEmail)] : []),
    ...(domains.length ? [plain("MEMBER_EMAIL_DOMAINS", domains.join(","))] : []),
  ];
}

/**
 * The bindings for a version. `existed`: the Worker had a version before, so the settings that can
 * be kept are asked from it; `lost` are the names Cloudflare said it could not supply.
 */
export function settingBindings(
  settings: Setting[],
  existed: boolean,
  lost: ReadonlySet<string>,
): Binding[] {
  const bindings: Binding[] = [];
  for (const s of settings) {
    if (s.given) bindings.push(s.given);
    else if (s.keep && existed && !lost.has(s.name))
      bindings.push({ type: "inherit", name: s.name });
    else if (s.generate) bindings.push(s.generate());
  }
  return bindings;
}
