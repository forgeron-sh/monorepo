import { describe, expect, it, vi } from "vitest";
import {
  encodeResponse,
  simulatedSamlIdp,
  type Respond,
  type SimulatedSamlIdp,
} from "../../simulated-saml-idp";
import { completeSamlLogin, startSamlLogin, type SamlProvider, type SamlRequests } from "./saml";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const now = new Date("2026-11-03T10:00:00Z");
const SP = "https://acme.forgeron.app/auth/saml/metadata";
const ACS = "https://acme.forgeron.app/auth/saml/acs";
const login = { id: "_req1", relay: "relay-1" };

const memory = (): SamlRequests & { ids: Set<string> } => {
  const ids = new Set<string>();
  const assertions = new Set<string>();
  return {
    ids,
    async open(ws, id) {
      ids.add(`${ws}/${id}`);
    },
    async take(ws, id) {
      return ids.delete(`${ws}/${id}`);
    },
    async remember(ws, id) {
      if (assertions.has(`${ws}/${id}`)) return false;
      assertions.add(`${ws}/${id}`);
      return true;
    },
  };
};

const providerOf = (idp: SimulatedSamlIdp, over: Partial<SamlProvider> = {}): SamlProvider => ({
  idpEntityId: idp.entityId,
  ssoUrl: "https://idp.example.test/sso",
  certificates: [idp.certificate],
  spEntityId: SP,
  acsUrl: ACS,
  emailAttribute: "email",
  groupsAttribute: "groups",
  nameAttribute: "displayName",
  ...over,
});

const base: Respond = { requestId: login.id, acsUrl: ACS, audience: SP };

async function attempt(
  idp: SimulatedSamlIdp,
  xml: string,
  options: {
    provider?: Partial<SamlProvider>;
    requests?: ReturnType<typeof memory>;
    relay?: string;
    at?: Date;
  } = {},
) {
  const requests = options.requests ?? memory();
  if (!options.requests) requests.ids.add(`acme/${login.id}`);
  return completeSamlLogin({
    provider: providerOf(idp, options.provider),
    workspace: "acme",
    requests,
    now: options.at ?? now,
    form: new URLSearchParams({
      SAMLResponse: encodeResponse(xml),
      RelayState: options.relay ?? login.relay,
    }),
    login,
  });
}

describe("a signed response", () => {
  it.each(["assertion", "response", "both"] as const)(
    "is accepted when the %s is signed",
    async (sign) => {
      const idp = await simulatedSamlIdp();
      const identity = await attempt(idp, await idp.respond({ ...base, sign }));
      expect(identity).toEqual({
        subject: "saml:ely@acme.fr",
        email: "ely@acme.fr",
        name: "Ely Delva",
        groups: ["devs", "ops"],
      });
    },
  );

  it("is accepted with an EC P-256 key", async () => {
    const idp = await simulatedSamlIdp({ kind: "ec" });
    expect((await attempt(idp, await idp.respond(base))).email).toBe("ely@acme.fr");
  });

  it("is accepted with an InclusiveNamespaces PrefixList, which is honoured", async () => {
    const idp = await simulatedSamlIdp();
    expect((await attempt(idp, await idp.respond({ ...base, inclusive: "samlp" }))).email).toBe(
      "ely@acme.fr",
    );
    // The digest was made with the prefix rendered: an IdP that rendered none would not match.
    await expect(
      attempt(
        idp,
        (await idp.respond({ ...base, inclusive: "samlp" })).replace(
          'PrefixList="samlp"',
          'PrefixList="#default"',
        ),
      ),
    ).rejects.toThrow(/digest/);
  });

  it("takes the email from the NameID when no attribute is configured, and is not fooled by a comment", async () => {
    const idp = await simulatedSamlIdp();
    const xml = (await idp.respond({ ...base, attributes: {} })).replace(
      "ely@acme.fr",
      "ely<!-- x -->@acme.fr",
    );
    const identity = await attempt(idp, xml, {
      provider: { emailAttribute: "", groupsAttribute: "", nameAttribute: "" },
    });
    // Comments are not part of what is signed, and the text around them is one string: the NameID
    // read is the one the signature covers.
    expect(identity).toMatchObject({ email: "ely@acme.fr", groups: [], name: "ely@acme.fr" });
  });

  it("accepts a rotated certificate: any pinned one may sign", async () => {
    const old = await simulatedSamlIdp();
    const next = await simulatedSamlIdp();
    const xml = await next.respond({ ...base, issuer: old.entityId });
    expect(
      (await attempt(old, xml, { provider: { certificates: [old.certificate, next.certificate] } }))
        .email,
    ).toBe("ely@acme.fr");
  });

  it("tolerates a clock a little late, not a lot", async () => {
    const idp = await simulatedSamlIdp();
    // Valid until 10:05:00; 10:06:30 is inside the two minutes of skew, 10:08 is not.
    const xml = await idp.respond(base);
    expect((await attempt(idp, xml, { at: new Date("2026-11-03T10:06:30Z") })).email).toBe(
      "ely@acme.fr",
    );
    await expect(attempt(idp, xml, { at: new Date("2026-11-03T10:08:00Z") })).rejects.toThrow(
      /expired|bearer/,
    );
  });
});

describe("a response that must be refused", () => {
  const outcome = async (over: Partial<Respond>) => {
    const idp = await simulatedSamlIdp();
    return attempt(idp, await idp.respond({ ...base, ...over }));
  };

  it("is unsigned", async () => {
    await expect(outcome({ sign: "none" })).rejects.toThrow(/not signed/);
  });
  it("is signed by a certificate that is not pinned", async () => {
    const stranger = await simulatedSamlIdp();
    await expect(outcome({ signWith: stranger })).rejects.toThrow(/pinned certificate/);
  });
  it("has no pinned certificate", async () => {
    const idp = await simulatedSamlIdp();
    await expect(
      attempt(idp, await idp.respond(base), { provider: { certificates: [] } }),
    ).rejects.toThrow(/No certificate/);
  });
  it("was altered after it was signed", async () => {
    const idp = await simulatedSamlIdp();
    const xml = (await idp.respond(base)).replace(
      ">ely@acme.fr</saml:NameID>",
      ">root@acme.fr</saml:NameID>",
    );
    await expect(attempt(idp, xml)).rejects.toThrow(/digest/);
  });
  it("had its signed info altered", async () => {
    const idp = await simulatedSamlIdp();
    const xml = (await idp.respond(base)).replace("<ds:SignedInfo>", '<ds:SignedInfo Id="x">');
    await expect(attempt(idp, xml)).rejects.toThrow(/pinned certificate/);
  });
  it("uses a signature algorithm that is not allowed", async () => {
    await expect(
      outcome({ signatureMethod: "http://www.w3.org/2000/09/xmldsig#rsa-sha1" }),
    ).rejects.toThrow(/Only RSA-SHA256/);
    await expect(
      outcome({ signatureMethod: "http://www.w3.org/2001/04/xmldsig-more#hmac-sha256" }),
    ).rejects.toThrow(/Only RSA-SHA256/);
  });
  it("has expired", async () => {
    await expect(
      outcome({
        notOnOrAfter: "2026-11-03T09:00:00Z",
        confirmationNotOnOrAfter: "2026-11-03T09:00:00Z",
      }),
    ).rejects.toThrow(/expired|bearer/);
  });
  it("has an expired confirmation only", async () => {
    await expect(outcome({ confirmationNotOnOrAfter: "2026-11-03T09:00:00Z" })).rejects.toThrow(
      /bearer/,
    );
  });
  it("is not valid yet", async () => {
    await expect(outcome({ notBefore: "2026-11-03T10:10:00Z" })).rejects.toThrow(/not valid yet/);
  });
  it("is for another audience", async () => {
    await expect(outcome({ audiences: ["https://other.forgeron.app/x"] })).rejects.toThrow(
      /audience/,
    );
  });
  it("is for another recipient", async () => {
    await expect(outcome({ recipient: "https://evil.example/acs" })).rejects.toThrow(/bearer/);
  });
  it("answers another request", async () => {
    await expect(outcome({ confirmationInResponseTo: "_other" })).rejects.toThrow(/bearer/);
  });
  it("comes from another issuer", async () => {
    await expect(outcome({ issuer: "https://evil.example/idp" })).rejects.toThrow(/issuer/);
  });
  it("reports a failure", async () => {
    await expect(
      outcome({ status: "urn:oasis:names:tc:SAML:2.0:status:Requester" }),
    ).rejects.toThrow(/success/);
  });
  it("has a transient NameID", async () => {
    await expect(
      outcome({ nameIdFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient" }),
    ).rejects.toThrow(/transient/);
  });
  it("has no email", async () => {
    await expect(outcome({ nameId: "not-an-email", attributes: {} })).rejects.toThrow(/no email/);
  });
  it("is for another destination when the response is signed", async () => {
    await expect(
      outcome({ sign: "response", destination: "https://evil.example/acs" }),
    ).rejects.toThrow(/destination/);
  });
  it("answers another request when the response is signed", async () => {
    await expect(outcome({ sign: "response", inResponseTo: "_other" })).rejects.toThrow(
      /another request/,
    );
  });

  it("is an encrypted assertion", async () => {
    const idp = await simulatedSamlIdp();
    const xml = (await idp.respond({ ...base, sign: "response" })).replace(
      "</samlp:Response>",
      `<saml:EncryptedAssertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"/></samlp:Response>`,
    );
    await expect(attempt(idp, xml)).rejects.toThrow(/Encrypted|digest/);
  });

  it("does not match the relay state of the browser", async () => {
    const idp = await simulatedSamlIdp();
    await expect(attempt(idp, await idp.respond(base), { relay: "other" })).rejects.toThrow(
      /relay/,
    );
  });
  it("answers a request that is unknown, expired or already answered", async () => {
    const idp = await simulatedSamlIdp();
    const requests = memory();
    await expect(attempt(idp, await idp.respond(base), { requests })).rejects.toThrow(
      /unknown, expired/,
    );
  });
  it("is the same POST sent twice", async () => {
    const idp = await simulatedSamlIdp();
    const xml = await idp.respond(base);
    const requests = memory();
    requests.ids.add(`acme/${login.id}`);
    expect((await attempt(idp, xml, { requests })).email).toBe("ely@acme.fr");
    await expect(attempt(idp, xml, { requests })).rejects.toThrow(/unknown, expired|already/);
  });
  it("carries an assertion that was already accepted", async () => {
    const idp = await simulatedSamlIdp();
    const requests = memory();
    requests.ids.add(`acme/${login.id}`);
    await requests.remember("acme", "_assertion1", now, now);
    await expect(attempt(idp, await idp.respond(base), { requests })).rejects.toThrow(
      /already used/,
    );
  });
});

describe("signature wrapping", () => {
  const assertionOf = (xml: string) => /<saml:Assertion[\s\S]*<\/saml:Assertion>/.exec(xml)![0];
  const signatureOf = (xml: string) => /<ds:Signature[\s\S]*?<\/ds:Signature>/.exec(xml)![0];
  const evilOf = (assertion: string) =>
    assertion
      .replace(/<ds:Signature[\s\S]*?<\/ds:Signature>/, "")
      .replaceAll("ely@acme.fr", "root@acme.fr");

  async function signed() {
    const idp = await simulatedSamlIdp();
    return { idp, xml: await idp.respond(base) };
  }

  it("refuses an evil assertion first, the signed one moved into Extensions", async () => {
    const { idp, xml } = await signed();
    const original = assertionOf(xml);
    const evil = evilOf(original).replace('ID="_assertion1"', 'ID="_evil"');
    const wrapped = xml.replace(
      original,
      `${evil}<samlp:Extensions>${original}</samlp:Extensions>`,
    );
    await expect(attempt(idp, wrapped)).rejects.toThrow(/not signed/);
  });

  it("refuses an evil assertion that carries a copy of the signature (another ID)", async () => {
    const { idp, xml } = await signed();
    const original = assertionOf(xml);
    const evil = evilOf(original)
      .replace('ID="_assertion1"', 'ID="_evil"')
      .replace("</saml:Issuer>", `</saml:Issuer>${signatureOf(xml)}`);
    await expect(attempt(idp, xml.replace(original, evil))).rejects.toThrow(/does not reference/);
  });

  it("refuses an evil assertion that keeps the ID and the signature (the digest is of other bytes)", async () => {
    const { idp, xml } = await signed();
    const original = assertionOf(xml);
    const evil = evilOf(original).replace("</saml:Issuer>", `</saml:Issuer>${signatureOf(xml)}`);
    await expect(attempt(idp, xml.replace(original, evil))).rejects.toThrow(/digest/);
  });

  it("refuses the same, with the genuine assertion still in the document (a shared ID)", async () => {
    const { idp, xml } = await signed();
    const original = assertionOf(xml);
    const evil = evilOf(original).replace("</saml:Issuer>", `</saml:Issuer>${signatureOf(xml)}`);
    const wrapped = xml.replace(
      original,
      `${evil}<samlp:Extensions>${original}</samlp:Extensions>`,
    );
    await expect(attempt(idp, wrapped)).rejects.toThrow(/reuses an ID/);
  });

  it("refuses a second assertion next to a signed response", async () => {
    const idp = await simulatedSamlIdp();
    const xml = await idp.respond({ ...base, sign: "response" });
    const extra = evilOf(assertionOf(xml)).replace('ID="_assertion1"', 'ID="_evil"');
    await expect(
      attempt(idp, xml.replace("</samlp:Response>", `${extra}</samlp:Response>`)),
    ).rejects.toThrow(/exactly one assertion/);
  });

  it("refuses a signature that was moved where it is not a child of what it covers", async () => {
    const { idp, xml } = await signed();
    const signature = signatureOf(xml);
    const moved = xml
      .replace(signature, "")
      .replace("<saml:Subject>", `<saml:Subject>${signature}`);
    await expect(attempt(idp, moved)).rejects.toThrow(/not signed/);
  });

  it("refuses a Response whose signed attributes were changed to another request", async () => {
    const idp = await simulatedSamlIdp();
    const xml = (await idp.respond({ ...base, sign: "response" })).replace(
      'InResponseTo="_req1"',
      'InResponseTo="_req2"',
    );
    await expect(attempt(idp, xml)).rejects.toThrow(/digest/);
  });

  it("reads an assertion-only signature on its own: the unsigned Response attributes decide nothing", async () => {
    const { idp, xml } = await signed();
    // Only the Assertion is signed, so a changed Destination on the Response proves nothing; the
    // assertion's own Recipient (signed) is what is checked.
    const tampered = xml.replace(`Destination="${ACS}"`, 'Destination="https://evil.example/acs"');
    expect((await attempt(idp, tampered)).email).toBe("ely@acme.fr"); // the assertion's own Recipient is checked
  });
});

describe("DOCTYPE and entities", () => {
  it("refuses an external entity", async () => {
    const idp = await simulatedSamlIdp();
    const xml = `<?xml version="1.0"?><!DOCTYPE r [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>${await idp.respond(base)}`;
    await expect(attempt(idp, xml)).rejects.toThrow(/DOCTYPE/);
  });
  it("refuses an entity reference even without a DOCTYPE", async () => {
    const idp = await simulatedSamlIdp();
    const xml = (await idp.respond(base)).replace(">Ely Delva<", ">&xxe;<");
    await expect(attempt(idp, xml)).rejects.toThrow(/entity/);
  });
});

describe("the request", () => {
  it("is a deflated HTTP-Redirect AuthnRequest with a relay state, recorded for the response", async () => {
    const idp = await simulatedSamlIdp();
    const requests = memory();
    const { url, login: state } = await startSamlLogin({
      provider: providerOf(idp),
      workspace: "acme",
      requests,
      now,
      seconds: 600,
    });
    const target = new URL(url);
    expect(target.origin + target.pathname).toBe("https://idp.example.test/sso");
    expect(target.searchParams.get("RelayState")).toBe(state.relay);
    const packed = Uint8Array.from(atob(target.searchParams.get("SAMLRequest")!), (c) =>
      c.charCodeAt(0),
    );
    const xml = await new Response(
      new Blob([packed]).stream().pipeThrough(new DecompressionStream("deflate-raw")),
    ).text();
    expect(xml).toContain(`ID="${state.id}"`);
    expect(xml).toContain(`AssertionConsumerServiceURL="${ACS}"`);
    expect(xml).toContain(`<saml:Issuer>${SP}</saml:Issuer>`);
    expect(requests.ids.has(`acme/${state.id}`)).toBe(true);
  });
});
