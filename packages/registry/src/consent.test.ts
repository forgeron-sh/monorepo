import { Miniflare } from "miniflare";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { D1Database } from "@forgeron/hosting";
import {
  ConsentError,
  createConsent,
  createRegistry,
  createSecretBox,
  migratePlatform,
  type Consent,
  type ConsentFetch,
  type Registry,
} from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// A throwaway key made of zeros: it protects nothing and is not a secret.
const TEST_KEY = btoa(String.fromCharCode(...new Uint8Array(32)));

// A simulated identity provider: it issues fake codes and tokens, and records what it was asked.
function simulatedProvider() {
  const calls: URLSearchParams[] = [];
  let issued = 0;
  let refuseRefresh = false;
  const fetch: ConsentFetch = async (_url, init) => {
    const form = new URLSearchParams(init.body);
    calls.push(form);
    if (form.get("grant_type") === "refresh_token" && refuseRefresh) {
      return { ok: false, status: 400, json: async () => ({ error: "invalid_grant" }) };
    }
    if (form.get("grant_type") === "authorization_code" && form.get("code") !== "code-ok") {
      return { ok: false, status: 400, json: async () => ({ error: "invalid_grant" }) };
    }
    issued++;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        access_token: `access-${issued}`,
        refresh_token: `refresh-${issued}`,
        expires_in: 3600,
      }),
    };
  };
  return { fetch, calls, refuse: () => (refuseRefresh = true) };
}

let mf: Miniflare;
let d1: D1Database;
let registry: Registry;
let consent: Consent;
let idp: ReturnType<typeof simulatedProvider>;
let clock = Date.UTC(2026, 10, 3, 12, 0, 0);
let toolId: string;

const target = () => ({
  toolId,
  environment: "production" as const,
  userId: "ada@example.test",
  connector: "microsoft-365",
});

beforeEach(async () => {
  clock = Date.UTC(2026, 10, 3, 12, 0, 0);
  mf = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('') } }",
    compatibilityDate: "2026-07-01",
    d1Databases: ["DB"],
  });
  d1 = (await mf.getD1Database("DB")) as unknown as D1Database;
  await migratePlatform(d1);
  const box = await createSecretBox(TEST_KEY);
  const now = () => new Date(clock);
  registry = createRegistry(d1, { secrets: box, now });
  toolId = (await registry.createTool({ workspace: "acme", name: "mail" })).id;
  idp = simulatedProvider();
  consent = createConsent({
    registry,
    box,
    now,
    fetch: idp.fetch,
    providers: {
      "microsoft-365": {
        authorizeUrl: "https://idp.example.test/authorize",
        tokenUrl: "https://idp.example.test/token",
        clientId: "client-id",
        clientSecret: "client-secret-for-tests",
        redirectUri: "https://platform.example.test/consent/callback",
      },
    },
  });
});
afterEach(() => mf.dispose());

async function consentAs(scopes = ["Mail.Send"]) {
  const { url } = await consent.start({ ...target(), scopes });
  const state = new URL(url).searchParams.get("state")!;
  await consent.complete({ state, code: "code-ok" });
  return url;
}

const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => undefined,
    (error: ConsentError) => error.code,
  );

describe("consent", () => {
  it("is requested on first use, then served from the stored tokens", async () => {
    expect(await codeOf(consent.accessToken(target()))).toBe("CONSENT_REQUIRED");
    const url = new URL(await consentAs());
    expect(url.origin + url.pathname).toBe("https://idp.example.test/authorize");
    expect(url.searchParams.get("scope")).toBe("Mail.Send");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(await consent.accessToken(target())).toBe("access-1");
    expect(idp.calls).toHaveLength(1);
  });

  it("proves the PKCE verifier to the provider", async () => {
    const url = new URL(await consentAs());
    const verifier = idp.calls[0]!.get("code_verifier")!;
    const digest = new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
    );
    const challenge = btoa(String.fromCharCode(...digest))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(url.searchParams.get("code_challenge")).toBe(challenge);
  });

  it("keeps the tokens unreadable in the database and out of the listings", async () => {
    await consentAs();
    const raw = JSON.stringify((await d1.prepare(`SELECT * FROM "connections"`).all()).results);
    expect(raw).not.toContain("access-1");
    expect(raw).not.toContain("refresh-1");
    const listed = await registry.listConnections(toolId, "production");
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      userId: "ada@example.test",
      connector: "microsoft-365",
      scopes: ["Mail.Send"],
    });
    expect(JSON.stringify(listed)).not.toContain("access-1");
  });

  it("keeps each person's consent apart", async () => {
    await consentAs();
    const other = { ...target(), userId: "grace@example.test" };
    expect(await codeOf(consent.accessToken(other))).toBe("CONSENT_REQUIRED");
    expect(await registry.listConnections(toolId, "production", { userId: other.userId })).toEqual(
      [],
    );
  });

  it("lets the admin revoke a consent", async () => {
    await consentAs();
    expect(await registry.revokeConnection(target())).toBe(true);
    expect(await registry.revokeConnection(target())).toBe(false);
    expect(await codeOf(consent.accessToken(target()))).toBe("CONSENT_REQUIRED");
  });

  it("refreshes an access token that is about to expire", async () => {
    await consentAs();
    clock += 3_600_000;
    expect(await consent.accessToken(target())).toBe("access-2");
    expect(idp.calls[1]!.get("refresh_token")).toBe("refresh-1");
    expect(await consent.accessToken(target())).toBe("access-2");
  });

  it("asks for consent again when the provider refuses the refresh", async () => {
    await consentAs();
    idp.refuse();
    clock += 3_600_000;
    expect(await codeOf(consent.accessToken(target()))).toBe("CONSENT_REQUIRED");
    expect(await registry.listConnections(toolId, "production")).toEqual([]);
  });

  it("refuses a forged, replayed-too-late or unknown state, and a refused code", async () => {
    expect(await codeOf(consent.complete({ state: "x.y", code: "code-ok" }))).toBe("INVALID_STATE");
    const { url } = await consent.start({ ...target(), scopes: [] });
    const state = new URL(url).searchParams.get("state")!;
    clock += 601_000;
    expect(await codeOf(consent.complete({ state, code: "code-ok" }))).toBe("INVALID_STATE");
    clock -= 601_000;
    expect(await codeOf(consent.complete({ state, code: "wrong" }))).toBe("PROVIDER_REFUSED");
    expect(await codeOf(consent.start({ ...target(), connector: "nope", scopes: [] }))).toBe(
      "UNKNOWN_CONNECTOR",
    );
  });
});
