import type { IdentityProviderConfig, IdentityProviderInput } from "@forgeron/registry";
import type { OidcProvider } from "./oidc";

// Microsoft Entra ID and Google Workspace are OIDC providers (D-019): a preset only fixes the
// issuer, the restriction that keeps other organisations out, and where the claims are (D-033).

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DOMAIN = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
const ROLE = /^[a-z][a-z0-9-]{0,39}$/;

const GOOGLE_ISSUER = "https://accounts.google.com";
const entraIssuer = (tenant: string) => `https://login.microsoftonline.com/${tenant}/v2.0`;

/** The OIDC provider a stored configuration stands for. */
export function providerFromConfig(
  config: Pick<
    IdentityProviderConfig,
    "kind" | "issuer" | "clientId" | "tenant" | "hostedDomain" | "emailClaim" | "groupsClaim"
  > & { clientSecret?: string },
  redirectUri: string,
): OidcProvider | undefined {
  const issuer =
    config.kind === "entra" && config.tenant
      ? entraIssuer(config.tenant)
      : config.kind === "google"
        ? GOOGLE_ISSUER
        : config.kind === "oidc"
          ? config.issuer
          : undefined;
  if (!issuer) return undefined;
  // The UPN is what Entra always puts in an ID token; `email` is an optional claim.
  const emailClaim =
    config.emailClaim ?? (config.kind === "entra" ? "preferred_username" : undefined);
  const groupsClaim = config.groupsClaim ?? (config.kind === "entra" ? "groups" : undefined);
  return {
    issuer,
    clientId: config.clientId,
    ...(config.clientSecret ? { clientSecret: config.clientSecret } : {}),
    redirectUri,
    ...(config.kind === "entra" && config.tenant ? { tenant: config.tenant.toLowerCase() } : {}),
    ...(config.kind === "google" && config.hostedDomain
      ? { hostedDomain: config.hostedDomain }
      : {}),
    ...(emailClaim ? { emailClaim } : {}),
    ...(groupsClaim ? { groupsClaim } : {}),
  };
}

const str = (value: unknown, max: number): string | undefined =>
  typeof value === "string" && value.trim() !== "" && value.length <= max
    ? value.trim()
    : undefined;

/** Checks the body of `PUT /api/identity-provider`. Nothing is guessed: a preset's restriction is required. */
export function parseIdentityProviderInput(
  body: unknown,
): { input: IdentityProviderInput } | { message: string } {
  const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const kind = b.kind;
  if (kind !== "oidc" && kind !== "entra" && kind !== "google") {
    return { message: "`kind` must be oidc, entra or google." };
  }
  const clientId = str(b.clientId, 256);
  if (!clientId) return { message: "`clientId` is required." };
  const input: IdentityProviderInput = { kind, clientId };
  if (b.clientSecret !== undefined) {
    const secret = str(b.clientSecret, 4096);
    if (!secret) return { message: "`clientSecret` must be a non-empty string." };
    input.clientSecret = secret;
  }
  if (kind === "oidc") {
    const issuer = str(b.issuer, 512);
    if (!issuer || !/^https:\/\/[^\s/]+(\/[^\s]*)?$/.test(issuer)) {
      return { message: "`issuer` must be an https URL." };
    }
    input.issuer = issuer;
  }
  if (kind === "entra") {
    const tenant = str(b.tenant, 64);
    // `common`, `organizations` and `consumers` would admit other directories.
    if (!tenant || !GUID.test(tenant))
      return { message: "`tenant` must be the directory (tenant) id." };
    input.tenant = tenant.toLowerCase();
  }
  if (kind === "google") {
    const hostedDomain = str(b.hostedDomain, 253);
    if (!hostedDomain || !DOMAIN.test(hostedDomain)) {
      return { message: "`hostedDomain` must be the Google Workspace domain." };
    }
    input.hostedDomain = hostedDomain.toLowerCase();
  }
  for (const key of ["emailClaim", "groupsClaim"] as const) {
    if (b[key] === undefined) continue;
    const claim = str(b[key], 64);
    if (!claim) return { message: `\`${key}\` must be a claim name.` };
    input[key] = claim;
  }
  if (b.groupRoles !== undefined) {
    const entries =
      typeof b.groupRoles === "object" && b.groupRoles !== null
        ? Object.entries(b.groupRoles)
        : undefined;
    if (!entries || entries.length > 100)
      return { message: "`groupRoles` must map groups to roles." };
    const roles: Record<string, string> = {};
    for (const [group, role] of entries) {
      if (!group || group.length > 256 || typeof role !== "string" || !ROLE.test(role)) {
        return { message: "`groupRoles` must map a group to a role name." };
      }
      roles[group] = role;
    }
    input.groupRoles = roles;
  }
  return { input };
}
