// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { InstallPage, loadProvider, SignInPage, splitCertificates } from "./settings";
import { button, cleanup, click, fakeApi, field, mount, refusal, submit, type } from "./test-utils";
import type { WorkspaceInfo } from "./workspace";

afterEach(cleanup);

const ws = (patch: Partial<WorkspaceInfo> = {}): WorkspaceInfo => ({
  workspace: "demo",
  endpoint: "https://demo.example.test",
  person: { id: "m1", email: "ada@acme.fr", name: "ada", roles: ["admin"], admin: true },
  setup: { members: 1, invitations: 0, tools: 0, deployed: 0, called: false },
  signIn: {
    email: { enabled: true, mail: "console" },
    oidc: { enabled: true, configured: false },
    saml: { enabled: true, configured: false },
  },
  install: { baseDomain: "example.test" },
  ...patch,
});

const CERT = "-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----";

describe("loadProvider", () => {
  it("reads no provider, an OIDC one and a SAML one, and never a secret", async () => {
    expect(await loadProvider(async () => ({ provider: null }))).toBeNull();
    const oidc = await loadProvider(async () => ({
      provider: {
        kind: "entra",
        clientId: "c",
        tenant: "t",
        clientSecret: "leaked",
        groupRoles: { g: "r" },
      },
    }));
    expect(oidc).toEqual({ kind: "entra", clientId: "c", tenant: "t", groupRoles: { g: "r" } });
    const saml = await loadProvider(async () => ({
      provider: { kind: "saml", idpEntityId: "e", ssoUrl: "https://i", certificates: [CERT] },
    }));
    expect(saml).toMatchObject({ kind: "saml", idpEntityId: "e", certificates: [CERT] });
  });
  it("splits pasted certificates", () => {
    expect(splitCertificates(`${CERT}\n\n${CERT}\n`)).toEqual([CERT, CERT]);
  });
});

describe("SignInPage", () => {
  it("is for admins", async () => {
    const { api } = fakeApi({});
    const page = await mount(
      <SignInPage
        api={api}
        ws={ws({ person: { id: "m2", email: "b", name: "b", roles: [], admin: false } })}
      />,
    );
    expect(page.textContent).toContain("Sign-in is for admins.");
  });

  it("says how email sign-in works, and warns about the console mail mode", async () => {
    const { api } = fakeApi({ "/api/identity-provider": { provider: null } });
    const page = await mount(<SignInPage api={api} ws={ws()} />);
    expect(page.textContent).toContain("Mail mode is console.");
    expect(page.textContent).toContain("https://demo.example.test/auth/callback");
    expect(page.textContent).toContain("https://demo.example.test/auth/saml/acs");
    expect(page.textContent).toContain("Not configured");
  });

  it("tells how to turn email on when it is off", async () => {
    const { api } = fakeApi({ "/api/identity-provider": { provider: null } });
    const page = await mount(
      <SignInPage
        api={api}
        ws={ws({
          signIn: {
            email: { enabled: false, mail: "off" },
            oidc: { enabled: true, configured: false },
            saml: { enabled: true, configured: false },
          },
        })}
      />,
    );
    expect(page.textContent).toContain("Email sign-in is off.");
    expect(page.textContent).toContain("forgeron platform install --sign-in email");
  });

  it("saves OpenID Connect with the secret, sending only what the kind needs", async () => {
    const { api, sent } = fakeApi({
      "/api/identity-provider": { provider: null },
      "PUT /api/identity-provider": {},
    });
    const page = await mount(<SignInPage api={api} ws={ws()} />);
    await type(field(page, "Client ID"), "client-1");
    await type(field(page, "Issuer URL"), "https://login.example.test");
    await type(field(page, "Client secret"), "test-only-secret");
    await submit(page.querySelectorAll("form")[0]);
    expect(sent.at(-1)).toEqual({
      path: "/api/identity-provider",
      body: {
        kind: "oidc",
        clientId: "client-1",
        clientSecret: "test-only-secret",
        issuer: "https://login.example.test",
      },
      method: "PUT",
    });
    expect(page.textContent).toContain("OpenID Connect saved.");
  });

  it("keeps the saved secret when the field is empty, and keeps the group roles", async () => {
    const { api, sent } = fakeApi({
      "/api/identity-provider": {
        provider: {
          kind: "google",
          clientId: "c",
          hostedDomain: "acme.fr",
          groupRoles: { g: "admin" },
        },
      },
      "PUT /api/identity-provider": {},
    });
    const page = await mount(<SignInPage api={api} ws={ws()} />);
    expect(page.textContent).toContain("A secret is kept.");
    await submit(page.querySelectorAll("form")[0]);
    expect(sent.at(-1)!.body).toEqual({
      kind: "google",
      clientId: "c",
      hostedDomain: "acme.fr",
      groupRoles: { g: "admin" },
    });
  });

  it("saves SAML with the certificates split", async () => {
    const { api, sent } = fakeApi({
      "/api/identity-provider": { provider: null },
      "PUT /api/identity-provider": {},
    });
    const page = await mount(<SignInPage api={api} ws={ws()} />);
    const form = page.querySelectorAll("form")[1]!;
    await type(field(form, "Identity provider entity ID"), "https://idp.example.test");
    await type(field(form, "Sign-on URL"), "https://idp.example.test/sso");
    await type(field(form, "Certificates"), CERT);
    await submit(form);
    expect(sent.at(-1)!.body).toEqual({
      kind: "saml",
      idpEntityId: "https://idp.example.test",
      ssoUrl: "https://idp.example.test/sso",
      certificates: [CERT],
    });
  });

  it("shows what the platform said when it refuses a provider", async () => {
    const { api } = fakeApi({
      "/api/identity-provider": { provider: null },
      "PUT /api/identity-provider": () => {
        throw refusal(400, "`issuer` must be an https URL.");
      },
    });
    const page = await mount(<SignInPage api={api} ws={ws()} />);
    await submit(page.querySelectorAll("form")[0]);
    expect(page.querySelector("form [role=alert]")?.textContent).toContain(
      "`issuer` must be an https URL.",
    );
  });

  it("warns that saving one provider replaces the other, and removes after a confirmation", async () => {
    const { api, sent } = fakeApi({
      "/api/identity-provider": {
        provider: {
          kind: "saml",
          idpEntityId: "e",
          ssoUrl: "https://i",
          certificates: [CERT],
          groupRoles: {},
        },
      },
      "DELETE /api/identity-provider": undefined,
    });
    const page = await mount(<SignInPage api={api} ws={ws()} />);
    expect(page.textContent).toContain("SAML is configured. Saving OpenID Connect replaces it.");
    await click(button(page, "Remove provider"));
    expect(sent).toEqual([]);
    const dialog = document.querySelector("[role=dialog]")!;
    await click(button(dialog, "Remove provider"));
    expect(sent.at(-1)).toEqual({
      path: "/api/identity-provider",
      body: undefined,
      method: "DELETE",
    });
  });

  it("shows the install", async () => {
    const page = await mount(<InstallPage ws={ws()} />);
    expect(page.textContent).toContain("example.test");
    expect(page.textContent).toContain("forgeron platform install");
  });

  it("shows the gateway's version and commit (D-123)", async () => {
    const page = await mount(
      <InstallPage
        ws={{
          ...ws(),
          install: { baseDomain: "example.test", version: "0.2.0", commit: "f95958b0c1a2d3e4" },
        }}
      />,
    );
    expect(page.textContent).toContain("0.2.0");
    expect(page.textContent).toContain("f95958b0c1a2");
    expect(page.textContent).not.toContain("f95958b0c1a2d3e4");
  });
});
