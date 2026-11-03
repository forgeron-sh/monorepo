import { toBase64Url, fromBase64Url } from "./sealed";
import type { Identity } from "./oidc";
import { pinnedKeys, verifySignature, DS } from "./saml-signature";
import {
  attribute,
  childrenNamed,
  descendants,
  parseXml,
  textOf,
  type XmlElement,
} from "./saml-xml";

// SAML 2.0 Web SSO, service-provider initiated: an HTTP-Redirect AuthnRequest, an HTTP-POST response
// to the assertion consumer service (D-049). The response is trusted only through a signature made by
// a certificate the administrator pinned, and only the data read from the element that signature
// covers. Web Crypto only: it runs in a Worker.

const SAML = "urn:oasis:names:tc:SAML:2.0:assertion";
const SAMLP = "urn:oasis:names:tc:SAML:2.0:protocol";
const SUCCESS = "urn:oasis:names:tc:SAML:2.0:status:Success";
const BEARER = "urn:oasis:names:tc:SAML:2.0:cm:bearer";
const TRANSIENT = "urn:oasis:names:tc:SAML:2.0:nameid-format:transient";
const MAX_RESPONSE = 700_000;
const DATE_TIME = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/;

export interface SamlProvider {
  /** The identity provider's entity id: the `Issuer` of what it signs. */
  idpEntityId: string;
  /** Where the browser is sent with the AuthnRequest (HTTP-Redirect binding). */
  ssoUrl: string;
  /** PEM or base64 certificates whose keys may sign: more than one lets the provider rotate. */
  certificates: string[];
  /** Our own entity id, the audience the assertion must name. */
  spEntityId: string;
  /** Where the identity provider posts the response. */
  acsUrl: string;
  /** The attribute (by `Name` or `FriendlyName`) that holds the email; the NameID if it is an email. */
  emailAttribute?: string;
  groupsAttribute?: string;
  nameAttribute?: string;
}

/** The short-lived memory that binds a response to the request that asked for it, and refuses replays. */
export interface SamlRequests {
  /** Records a request id, valid until `expiresAt`. */
  open(workspace: string, id: string, expiresAt: Date, now: Date): Promise<void>;
  /** Uses a request id once: `false` if it is unknown, expired or already used. */
  take(workspace: string, id: string, now: Date): Promise<boolean>;
  /** Records an assertion id until `until`: `false` if it was already accepted (a replay). */
  remember(workspace: string, assertionId: string, until: Date, now: Date): Promise<boolean>;
}

/** What the gateway keeps between the redirect and the response (in a sealed cookie). */
export interface SamlLogin {
  id: string;
  relay: string;
}

class SamlError extends Error {
  override name = "SamlError";
}

const fail = (message: string): never => {
  throw new SamlError(message);
};

const randomHex = (bytes: number) =>
  [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const escapeAttribute = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function deflate(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** The URL to send the person to, the state to keep, and the request id recorded for the response. */
export async function startSamlLogin(options: {
  provider: SamlProvider;
  workspace: string;
  requests: SamlRequests;
  now: Date;
  /** How long the person has to sign in at the provider. */
  seconds: number;
}): Promise<{ url: string; login: SamlLogin }> {
  const { provider } = options;
  const login: SamlLogin = {
    id: `_${randomHex(20)}`,
    relay: toBase64Url(crypto.getRandomValues(new Uint8Array(24))),
  };
  const request =
    `<samlp:AuthnRequest xmlns:samlp="${SAMLP}" xmlns:saml="${SAML}" ID="${login.id}" Version="2.0"` +
    ` IssueInstant="${options.now.toISOString().replace(/\.\d+Z$/, "Z")}"` +
    ` Destination="${escapeAttribute(provider.ssoUrl)}"` +
    ` ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"` +
    ` AssertionConsumerServiceURL="${escapeAttribute(provider.acsUrl)}">` +
    `<saml:Issuer>${escapeAttribute(provider.spEntityId)}</saml:Issuer>` +
    `<samlp:NameIDPolicy AllowCreate="true"/></samlp:AuthnRequest>`;
  const url = new URL(provider.ssoUrl);
  url.searchParams.set("SAMLRequest", btoa(String.fromCharCode(...(await deflate(request)))));
  url.searchParams.set("RelayState", login.relay);
  await options.requests.open(
    options.workspace,
    login.id,
    new Date(options.now.getTime() + options.seconds * 1000),
    options.now,
  );
  return { url: url.toString(), login };
}

const instant = (value: string | undefined, what: string): number => {
  if (!value || !DATE_TIME.test(value)) return fail(`${what} is missing or not a date.`);
  const time = Date.parse(value);
  return Number.isNaN(time) ? fail(`${what} is not a date.`) : time;
};

const single = (parent: XmlElement, local: string, what = local): XmlElement => {
  const found = childrenNamed(parent, SAML, local);
  return found.length === 1 ? found[0]! : fail(`The assertion needs exactly one ${what}.`);
};

const trimmed = (element: XmlElement): string => (textOf(element) ?? "").trim();

/** Checks an assertion that a pinned signature covers, and reads the person from it. */
function readAssertion(
  assertion: XmlElement,
  provider: SamlProvider,
  requestId: string,
  now: number,
  skew: number,
): { identity: Identity; assertionId: string; validUntil: number } {
  if (attribute(assertion, "Version") !== "2.0") fail("The assertion is not SAML 2.0.");
  const assertionId = attribute(assertion, "ID") ?? fail("The assertion has no ID.");
  if (trimmed(single(assertion, "Issuer")) !== provider.idpEntityId) {
    fail("The assertion comes from another issuer.");
  }

  const subject = single(assertion, "Subject");
  const nameId = single(subject, "NameID", "NameID (an encrypted one is not supported)");
  if (attribute(nameId, "Format") === TRANSIENT) {
    fail("The provider sent a transient NameID: configure a persistent one.");
  }
  const subjectId = trimmed(nameId);
  if (!subjectId) fail("The assertion has no subject.");

  // At least one bearer confirmation that is for us, for this request and still valid.
  let validUntil: number | undefined;
  for (const confirmation of childrenNamed(subject, SAML, "SubjectConfirmation")) {
    if (attribute(confirmation, "Method") !== BEARER) continue;
    const data = childrenNamed(confirmation, SAML, "SubjectConfirmationData")[0];
    if (!data) continue;
    if (attribute(data, "Recipient") !== provider.acsUrl) continue;
    if (attribute(data, "InResponseTo") !== requestId) continue;
    const until = Date.parse(attribute(data, "NotOnOrAfter") ?? "");
    if (!DATE_TIME.test(attribute(data, "NotOnOrAfter") ?? "") || now - skew >= until) continue;
    const from = attribute(data, "NotBefore");
    if (from !== undefined && now + skew < instant(from, "NotBefore")) continue;
    validUntil = until;
    break;
  }
  if (validUntil === undefined) {
    fail("No bearer confirmation is for this sign-in (recipient, request or validity).");
  }

  const conditions = single(assertion, "Conditions");
  const notBefore = attribute(conditions, "NotBefore");
  if (notBefore !== undefined && now + skew < instant(notBefore, "NotBefore")) {
    fail("The assertion is not valid yet.");
  }
  if (now - skew >= instant(attribute(conditions, "NotOnOrAfter"), "Conditions NotOnOrAfter")) {
    fail("The assertion has expired.");
  }
  for (const child of conditions.children) {
    if (typeof child === "string") continue;
    if (
      child.ns !== SAML ||
      !["AudienceRestriction", "OneTimeUse", "ProxyRestriction"].includes(child.local)
    ) {
      fail("The assertion has a condition that is not understood.");
    }
  }
  const restrictions = childrenNamed(conditions, SAML, "AudienceRestriction");
  if (restrictions.length === 0) fail("The assertion has no audience restriction.");
  for (const restriction of restrictions) {
    const audiences = childrenNamed(restriction, SAML, "Audience").map(trimmed);
    if (!audiences.includes(provider.spEntityId)) fail("The assertion is for another audience.");
  }
  if (childrenNamed(assertion, SAML, "AuthnStatement").length === 0) {
    fail("The assertion states no authentication.");
  }

  const values = new Map<string, string[]>();
  for (const statement of childrenNamed(assertion, SAML, "AttributeStatement")) {
    for (const attr of childrenNamed(statement, SAML, "Attribute")) {
      const list = childrenNamed(attr, SAML, "AttributeValue")
        .map((v) => textOf(v)?.trim())
        .filter((v): v is string => !!v);
      for (const key of [attribute(attr, "Name"), attribute(attr, "FriendlyName")]) {
        if (key) values.set(key, [...(values.get(key) ?? []), ...list]);
      }
    }
  }
  const email = provider.emailAttribute
    ? values.get(provider.emailAttribute)?.[0]
    : subjectId.includes("@")
      ? subjectId
      : undefined;
  if (!email || !email.includes("@")) fail("The assertion has no email.");
  const name = provider.nameAttribute ? values.get(provider.nameAttribute)?.[0] : undefined;
  return {
    identity: {
      // Prefixed: a SAML identifier must never equal an OIDC subject of the same workspace.
      subject: `saml:${subjectId}`,
      email: email!,
      name: name ?? email!,
      groups: provider.groupsAttribute
        ? [...new Set(values.get(provider.groupsAttribute) ?? [])]
        : [],
    },
    assertionId,
    validUntil: validUntil!,
  };
}

/** The response: structure, signature, then the assertion; then the request and the assertion are used up. */
export async function completeSamlLogin(options: {
  provider: SamlProvider;
  workspace: string;
  requests: SamlRequests;
  now: Date;
  form: URLSearchParams;
  login: SamlLogin;
  /** Tolerated clock difference with the identity provider. */
  skewSeconds?: number;
}): Promise<Identity> {
  const { provider, form, login } = options;
  const now = options.now.getTime();
  const skew = (options.skewSeconds ?? 120) * 1000;
  if (form.get("RelayState") !== login.relay) fail("The relay state does not match.");
  const encoded = form.get("SAMLResponse");
  if (!encoded || encoded.length > MAX_RESPONSE) fail("The response is missing or too large.");
  const bytes = fromBase64Url(
    encoded!.replace(/\s+/g, "").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, ""),
  );
  if (!bytes) fail("The response is not base64.");
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return fail("The response is not UTF-8.");
  }
  const root = parseXml(text);
  if (root.ns !== SAMLP || root.local !== "Response") fail("The message is not a SAML response.");

  const status = childrenNamed(root, SAMLP, "Status")[0];
  const code = status && childrenNamed(status, SAMLP, "StatusCode")[0];
  if (!code || attribute(code, "Value") !== SUCCESS) fail("The provider did not report a success.");
  if (childrenNamed(root, SAML, "EncryptedAssertion").length > 0) {
    fail("Encrypted assertions are not supported.");
  }
  const assertions = childrenNamed(root, SAML, "Assertion");
  if (assertions.length !== 1) fail("The response needs exactly one assertion.");
  const assertion = assertions[0]!;

  // An ID that two elements share is how a signature is made to vouch for the wrong one.
  const seen = new Set<string>();
  for (const element of descendants(root)) {
    for (const a of element.attributes) {
      if (a.ns !== "" || !["ID", "Id", "id"].includes(a.local)) continue;
      if (seen.has(a.value)) fail("The document reuses an ID.");
      seen.add(a.value);
    }
  }

  // Only a Signature that is a direct child of the Response or of its Assertion counts.
  const signatures: Array<[XmlElement, XmlElement]> = [
    ...childrenNamed(root, DS, "Signature").map((s): [XmlElement, XmlElement] => [s, root]),
    ...childrenNamed(assertion, DS, "Signature").map((s): [XmlElement, XmlElement] => [
      s,
      assertion,
    ]),
  ];
  if (signatures.length === 0) fail("The response is not signed.");
  if (provider.certificates.length === 0) fail("No certificate is pinned for this provider.");
  const keys = await pinnedKeys(provider.certificates);
  let responseSigned = false;
  for (const [signature, signed] of signatures) {
    await verifySignature(signature, signed, keys); // every signature present must hold
    if (signed === root) responseSigned = true;
  }
  if (responseSigned) {
    // The Response's own attributes are covered: they must be for us.
    if (attribute(root, "Destination") !== provider.acsUrl)
      fail("The response is for another destination.");
    const inResponseTo = attribute(root, "InResponseTo");
    if (inResponseTo !== undefined && inResponseTo !== login.id)
      fail("The response answers another request.");
    const issuer = childrenNamed(root, SAML, "Issuer")[0];
    if (issuer && trimmed(issuer) !== provider.idpEntityId)
      fail("The response comes from another issuer.");
  }

  const read = readAssertion(assertion, provider, login.id, now, skew);
  if (!(await options.requests.take(options.workspace, login.id, options.now))) {
    fail("The request is unknown, expired or already answered.");
  }
  const until = new Date(read.validUntil + skew);
  if (!(await options.requests.remember(options.workspace, read.assertionId, until, options.now))) {
    fail("This assertion was already used.");
  }
  return read.identity;
}

/** The service provider's metadata, to give to the identity provider's administrator. */
export function samlMetadata(provider: Pick<SamlProvider, "spEntityId" | "acsUrl">): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${escapeAttribute(provider.spEntityId)}">` +
    `<md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="${SAMLP}">` +
    `<md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${escapeAttribute(provider.acsUrl)}" index="0" isDefault="true"/>` +
    `</md:SPSSODescriptor></md:EntityDescriptor>`
  );
}
