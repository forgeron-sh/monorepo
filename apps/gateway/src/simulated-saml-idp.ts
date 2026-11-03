// A simulated SAML identity provider for the tests (D-049): a real RSA or EC key, a hand-built X.509
// certificate, and responses signed with Web Crypto. The documents are written directly in their
// canonical form (sorted attributes, expanded empty elements, namespaces declared where first used),
// so the digest and the signature are computed WITHOUT the gateway's own canonicalizer: the tests
// prove the verifier against an independent reading of the specification.

const SAML = "urn:oasis:names:tc:SAML:2.0:assertion";
const SAMLP = "urn:oasis:names:tc:SAML:2.0:protocol";
const DS = "http://www.w3.org/2000/09/xmldsig#";
const EXC = "http://www.w3.org/2001/10/xml-exc-c14n#";
const ENVELOPED = `${DS}enveloped-signature`;
const encoder = new TextEncoder();

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

// --- a minimal DER encoder, enough for a certificate whose signature nobody checks ---
const len = (n: number) => (n < 128 ? [n] : n < 256 ? [0x81, n] : [0x82, n >> 8, n & 0xff]);
const der = (tag: number, ...parts: Uint8Array[]) => {
  const body = parts.reduce((all, p) => Uint8Array.from([...all, ...p]), new Uint8Array());
  return Uint8Array.from([tag, ...len(body.length), ...body]);
};
const hexBytes = (hex: string) => Uint8Array.from(hex.match(/../g)!.map((h) => parseInt(h, 16)));
const name = () =>
  der(0x30, der(0x31, der(0x30, der(0x06, hexBytes("550403")), der(0x0c, encoder.encode("sim")))));

function certificateOf(spki: Uint8Array): string {
  const algorithm = der(0x30, der(0x06, hexBytes("2a864886f70d01010b")), der(0x05));
  const time = (t: string) => der(0x17, encoder.encode(t));
  const tbs = der(
    0x30,
    der(0xa0, der(0x02, Uint8Array.of(2))),
    der(0x02, Uint8Array.of(1)),
    algorithm,
    name(),
    der(0x30, time("260101000000Z"), time("360101000000Z")),
    name(),
    spki,
  );
  const certificate = der(0x30, tbs, algorithm, der(0x03, new Uint8Array(33)));
  return `-----BEGIN CERTIFICATE-----\n${b64(certificate)
    .match(/.{1,64}/g)!
    .join("\n")}\n-----END CERTIFICATE-----`;
}

export interface Respond {
  requestId: string;
  acsUrl: string;
  audience: string;
  /** Which element carries a Signature. */
  sign?: "assertion" | "response" | "both" | "none";
  nameId?: string;
  nameIdFormat?: string;
  attributes?: Record<string, string[]>;
  issuer?: string;
  assertionId?: string;
  responseId?: string;
  notBefore?: string;
  notOnOrAfter?: string;
  confirmationNotOnOrAfter?: string;
  recipient?: string;
  destination?: string;
  inResponseTo?: string;
  confirmationInResponseTo?: string;
  audiences?: string[];
  /** An `InclusiveNamespaces` PrefixList on the reference transform. */
  inclusive?: string;
  signatureMethod?: string;
  /** Sign with another provider's key (a certificate the gateway did not pin). */
  signWith?: SimulatedSamlIdp;
  status?: string;
}

export interface SimulatedSamlIdp {
  entityId: string;
  /** The certificate to pin, as PEM. */
  certificate: string;
  /** A signed SAMLResponse document (XML text). */
  respond(options: Respond): Promise<string>;
  /** Signs the canonical text of a `SignedInfo`; for the attacks that rebuild a document. */
  signText(text: string): Promise<string>;
}

export async function simulatedSamlIdp(
  options: { entityId?: string; kind?: "rsa" | "ec" } = {},
): Promise<SimulatedSamlIdp> {
  const entityId = options.entityId ?? "https://idp.example.test/saml";
  const kind = options.kind ?? "rsa";
  const pair = (await crypto.subtle.generateKey(
    kind === "rsa"
      ? {
          name: "RSASSA-PKCS1-v1_5",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        }
      : { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  )) as { publicKey: Parameters<typeof crypto.subtle.exportKey>[1]; privateKey: never };
  const spki = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey));
  const certificate = certificateOf(spki);
  const body = certificate.replace(/-----[A-Z ]+-----|\s/g, "");

  const signText = async (text: string) =>
    b64(
      new Uint8Array(
        await crypto.subtle.sign(
          kind === "rsa" ? { name: "RSASSA-PKCS1-v1_5" } : { name: "ECDSA", hash: "SHA-256" },
          pair.privateKey,
          encoder.encode(text),
        ),
      ),
    );
  const digestOf = async (text: string) =>
    b64(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text))));

  const idp: SimulatedSamlIdp = {
    entityId,
    certificate,
    signText,
    async respond(o) {
      const issuer = o.issuer ?? entityId;
      const assertionId = o.assertionId ?? "_assertion1";
      const responseId = o.responseId ?? "_response1";
      const sign = o.sign ?? "assertion";
      const attributes = o.attributes ?? {
        email: ["ely@acme.fr"],
        groups: ["devs", "ops"],
        displayName: ["Ely Delva"],
      };
      const attrs = (canon: boolean, pairs: Array<[string, string]>) =>
        (canon ? [...pairs].sort(([a], [b]) => (a < b ? -1 : 1)) : pairs)
          .map(([k, v]) => ` ${k}="${v}"`)
          .join("");

      const assertion = (canon: boolean, signature: string) => {
        // A PrefixList naming `samlp` makes the Assertion render that namespace too, though it never uses it.
        const decl = canon
          ? ` xmlns:saml="${SAML}"${o.inclusive?.split(" ").includes("samlp") ? ` xmlns:samlp="${SAMLP}"` : ""}`
          : "";
        const empty = (canon: boolean) =>
          canon
            ? `<saml:Attribute Name="empty"><saml:AttributeValue></saml:AttributeValue></saml:Attribute>`
            : `<saml:Attribute Name="empty"><saml:AttributeValue/></saml:Attribute>`;
        const statements = Object.entries(attributes)
          .map(
            ([n, values]) =>
              `<saml:Attribute Name="${n}">${values.map((v) => `<saml:AttributeValue>${v}</saml:AttributeValue>`).join("")}</saml:Attribute>`,
          )
          .join("");
        return (
          `<saml:Assertion${decl}${attrs(canon, [
            ["Version", "2.0"],
            ["ID", assertionId],
            ["IssueInstant", "2026-11-03T09:59:50Z"],
          ])}>` +
          `<saml:Issuer>${issuer}</saml:Issuer>${signature}` +
          `<saml:Subject><saml:NameID${o.nameIdFormat ? ` Format="${o.nameIdFormat}"` : ""}>${o.nameId ?? "ely@acme.fr"}</saml:NameID>` +
          `<saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData${attrs(
            canon,
            [
              ["Recipient", o.recipient ?? o.acsUrl],
              ["NotOnOrAfter", o.confirmationNotOnOrAfter ?? "2026-11-03T10:05:00Z"],
              ["InResponseTo", o.confirmationInResponseTo ?? o.requestId],
            ],
          )}>${canon ? "</saml:SubjectConfirmationData>" : ""}` +
          `${canon ? "" : "</saml:SubjectConfirmationData>"}</saml:SubjectConfirmation></saml:Subject>` +
          `<saml:Conditions${attrs(canon, [
            ["NotBefore", o.notBefore ?? "2026-11-03T09:59:00Z"],
            ["NotOnOrAfter", o.notOnOrAfter ?? "2026-11-03T10:05:00Z"],
          ])}><saml:AudienceRestriction>${(o.audiences ?? [o.audience])
            .map((a) => `<saml:Audience>${a}</saml:Audience>`)
            .join("")}</saml:AudienceRestriction></saml:Conditions>` +
          `<saml:AuthnStatement AuthnInstant="2026-11-03T09:59:45Z"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement>` +
          `<saml:AttributeStatement>${statements}${empty(canon)}</saml:AttributeStatement>` +
          `</saml:Assertion>`
        );
      };

      const response = (canon: boolean, assertionPart: string, signature: string) => {
        const decl = canon
          ? ` xmlns:samlp="${SAMLP}"`
          : ` xmlns:samlp="${SAMLP}" xmlns:saml="${SAML}"`;
        const attrsR = attrs(canon, [
          ["Version", "2.0"],
          ["ID", responseId],
          ["IssueInstant", "2026-11-03T09:59:55Z"],
          ["Destination", o.destination ?? o.acsUrl],
          ["InResponseTo", o.inResponseTo ?? o.requestId],
        ]);
        const issuerEl = canon
          ? `<saml:Issuer xmlns:saml="${SAML}">${issuer}</saml:Issuer>`
          : `<saml:Issuer>${issuer}</saml:Issuer>`;
        const code = o.status ?? "urn:oasis:names:tc:SAML:2.0:status:Success";
        const statusEl = canon
          ? `<samlp:Status><samlp:StatusCode Value="${code}"></samlp:StatusCode></samlp:Status>`
          : `<samlp:Status><samlp:StatusCode Value="${code}"/></samlp:Status>`;
        return `<samlp:Response${decl}${attrsR}>${issuerEl}${signature}${statusEl}${assertionPart}</samlp:Response>`;
      };

      const signer = o.signWith ?? idp;
      const transforms =
        `<ds:Transforms><ds:Transform Algorithm="${ENVELOPED}"></ds:Transform>` +
        (o.inclusive
          ? `<ds:Transform Algorithm="${EXC}"><ec:InclusiveNamespaces xmlns:ec="${EXC}" PrefixList="${o.inclusive}"></ec:InclusiveNamespaces></ds:Transform>`
          : `<ds:Transform Algorithm="${EXC}"></ds:Transform>`) +
        `</ds:Transforms>`;
      const signatureOf = async (id: string, canonicalContent: string) => {
        const signatureMethod =
          o.signatureMethod ??
          (kind === "rsa"
            ? "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"
            : "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256");
        const inner =
          `<ds:CanonicalizationMethod Algorithm="${EXC}"></ds:CanonicalizationMethod>` +
          `<ds:SignatureMethod Algorithm="${signatureMethod}"></ds:SignatureMethod>` +
          `<ds:Reference URI="#${id}">${transforms}<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod>` +
          `<ds:DigestValue>${await digestOf(canonicalContent)}</ds:DigestValue></ds:Reference>`;
        const value = await (signer as SimulatedSamlIdp).signText(
          `<ds:SignedInfo xmlns:ds="${DS}">${inner}</ds:SignedInfo>`,
        );
        return (
          `<ds:Signature xmlns:ds="${DS}"><ds:SignedInfo>${inner}</ds:SignedInfo>` +
          `<ds:SignatureValue>${value}</ds:SignatureValue><ds:KeyInfo><ds:X509Data><ds:X509Certificate>${body}</ds:X509Certificate></ds:X509Data></ds:KeyInfo></ds:Signature>`
        );
      };

      const assertionSigned = sign === "assertion" || sign === "both";
      const assertionSignature = assertionSigned
        ? await signatureOf(assertionId, assertion(true, ""))
        : "";
      // With a signed response, an assertion's own Signature is part of what the response covers.
      const canonicalAssertion = assertion(true, assertionSignature);
      const responseSignature =
        sign === "response" || sign === "both"
          ? await signatureOf(responseId, response(true, canonicalAssertion, ""))
          : "";
      return response(false, assertion(false, assertionSignature), responseSignature);
    },
  };
  return idp;
}

export const encodeResponse = (xml: string) => b64(encoder.encode(xml));
