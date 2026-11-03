import type { Manifest } from "@forgeron/manifest";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CloudflareError,
  createCloudflareClient,
  createGatewayBindings,
  createSelfHostHosting,
  deploy,
  GATEWAY_ASSETS_CONFIG,
  uploadAssets,
  serviceBindingName,
  type Build,
  type D1Database,
  type Asset,
  type Environment,
  type GatewayBindings,
} from "../index";
import { FakeCloudflare } from "./fake-cloudflare";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// D-029: the gateway holds a `TOOL_<WORKER>` binding per tool Worker, added and removed by
// uploading a new gateway version that inherits every other binding.

const GATEWAY = "forgeron-gateway";
const SECRET = "the-gateway-token";
const production: Environment = { tool: "crm", name: "production" };
const tool = "acme--crm--production";
const manifest = { resources: {} } as unknown as Manifest;
const build = (fingerprint: string): Build => ({
  manifest,
  worker: `export default { fetch: () => new Response("${fingerprint}") }`,
  fingerprint,
  migrations: [],
  changelog: { entries: [{}], declared: "patch", detected: "patch" },
});

let memory: MemoryD1;
let cloud: FakeCloudflare;
let known: string[];
let gateway: GatewayBindings;
let hosting: ReturnType<typeof createSelfHostHosting>;

const gatewayVersions = () => cloud.workers.get(GATEWAY)!.versions;
const deployed = () => {
  const worker = cloud.workers.get(GATEWAY)!;
  return worker.versions.find((v) => v.id === worker.deployed)!;
};
const gatewayUploads = () =>
  cloud.calls.filter((c) => c === `POST /workers/workers/${GATEWAY}/versions`);

beforeEach(async () => {
  memory = await createMemoryD1();
  cloud = new FakeCloudflare(() => memory as unknown as D1Database);
  const client = createCloudflareClient({ accountId: "acct", apiToken: "t", fetch: cloud.fetch });
  // The gateway as `platform install` leaves it: a D1, plain values and a secret.
  await client.request("POST", "/workers/workers", { name: GATEWAY });
  const first = await client.request<{ id: string }>(
    "POST",
    `/workers/workers/${GATEWAY}/versions`,
    {
      main_module: "worker.js",
      modules: [{ name: "worker.js", content_base64: "" }],
      bindings: [
        { type: "d1", name: "DB", id: "db-1" },
        { type: "plain_text", name: "BASE_DOMAIN", text: "forgeron.test" },
        { type: "secret_text", name: "CLOUDFLARE_API_TOKEN", text: SECRET },
      ],
    },
  );
  await client.request("POST", `/workers/scripts/${GATEWAY}/deployments`, {
    strategy: "percentage",
    versions: [{ percentage: 100, version_id: first.id }],
  });
  known = ["DB", "BASE_DOMAIN", "CLOUDFLARE_API_TOKEN"];
  cloud.calls.length = 0;
  gateway = createGatewayBindings(client, {
    worker: GATEWAY,
    bindings: () => known,
    code: () => "export default {}",
    compatibilityDate: "2026-10-01",
    compatibilityFlags: ["nodejs_compat"],
  });
  hosting = createSelfHostHosting({
    accountId: "acct",
    apiToken: "t",
    workspace: "acme",
    fetch: cloud.fetch,
    url: (name) => `https://${name}.example.test`,
    gateway,
  });
});
afterEach(() => memory.close());

describe("binding a tool Worker to the gateway", () => {
  it("adds TOOL_<WORKER> and keeps every other binding, the secret included", async () => {
    await deploy(hosting, production, build("v1"));
    const bindings = deployed().body.bindings;
    expect(bindings).toContainEqual({
      type: "service",
      name: serviceBindingName(tool),
      service: tool,
    });
    expect(bindings).toContainEqual({ type: "d1", name: "DB", id: "db-1" });
    expect(bindings).toContainEqual({
      type: "plain_text",
      name: "BASE_DOMAIN",
      text: "forgeron.test",
    });
    expect(bindings).toContainEqual({
      type: "secret_text",
      name: "CLOUDFLARE_API_TOKEN",
      text: SECRET,
    });
    expect(serviceBindingName(tool)).toBe("TOOL_ACME__CRM__PRODUCTION");
  });

  it("carries the secret over without ever sending its value", async () => {
    await deploy(hosting, production, build("v1"));
    const upload = cloud.uploads.at(-1)!;
    expect(JSON.stringify(upload)).not.toContain(SECRET);
    expect(upload.bindings).toContainEqual({ type: "inherit", name: "CLOUDFLARE_API_TOKEN" });
    expect(upload).toMatchObject({
      compatibility_date: "2026-10-01",
      compatibility_flags: ["nodejs_compat"],
    });
  });

  it("deploys the gateway only once the tool serves", async () => {
    await deploy(hosting, production, build("v1"));
    const toolDeployed = cloud.calls.indexOf(`POST /workers/scripts/${tool}/deployments`);
    const gatewayUploaded = cloud.calls.indexOf(`POST /workers/workers/${GATEWAY}/versions`);
    expect(toolDeployed).toBeGreaterThan(-1);
    expect(gatewayUploaded).toBeGreaterThan(toolDeployed);
    expect(cloud.workers.get(GATEWAY)!.deployed).toBe(gatewayVersions().at(-1)!.id);
  });

  it("does not redeploy the gateway for a new version of a tool it already has", async () => {
    await deploy(hosting, production, build("v1"));
    known.push(serviceBindingName(tool)); // the gateway now runs with the binding
    expect(gatewayUploads()).toHaveLength(1);
    await deploy(hosting, production, build("v2"));
    expect(gatewayUploads()).toHaveLength(1);
  });

  it("keeps the bindings of the other tools when it binds one more", async () => {
    await deploy(hosting, production, build("v1"));
    known.push(serviceBindingName(tool));
    await deploy(hosting, { tool: "hr", name: "production" }, build("v1"));
    const names = deployed().body.bindings.map((b) => b.name);
    expect(names).toEqual(
      expect.arrayContaining(["TOOL_ACME__CRM__PRODUCTION", "TOOL_ACME__HR__PRODUCTION", "DB"]),
    );
  });

  it("fails loudly when a binding it believes in is not on the gateway", async () => {
    known.push("GHOST");
    await expect(deploy(hosting, production, build("v1"))).rejects.toThrow(CloudflareError);
    expect(deployed().body.bindings.some((b) => b.name === serviceBindingName(tool))).toBe(false);
  });
});

describe("tearing a tool Worker down", () => {
  it("removes its binding, and only that one, before the Worker is deleted", async () => {
    await deploy(hosting, production, build("v1"));
    known.push(serviceBindingName(tool));
    cloud.calls.length = 0;
    await hosting.teardown(production);
    const names = deployed().body.bindings.map((b) => b.name);
    expect(names).toEqual(["DB", "BASE_DOMAIN", "CLOUDFLARE_API_TOKEN"]);
    expect(deployed().body.bindings).toContainEqual({
      type: "secret_text",
      name: "CLOUDFLARE_API_TOKEN",
      text: SECRET,
    });
    expect(cloud.calls.indexOf(`POST /workers/scripts/${GATEWAY}/deployments`)).toBeLessThan(
      cloud.calls.indexOf(`DELETE /workers/workers/${tool}`),
    );
  });

  it("does nothing to the gateway when it had no binding", async () => {
    await deploy(hosting, production, build("v1"));
    cloud.calls.length = 0;
    await hosting.teardown(production);
    expect(gatewayUploads()).toHaveLength(0);
  });
});

describe("without a gateway", () => {
  it("leaves the gateway alone", async () => {
    const alone = createSelfHostHosting({
      accountId: "acct",
      apiToken: "t",
      workspace: "acme",
      fetch: cloud.fetch,
      url: (name) => `https://${name}.example.test`,
    });
    await deploy(alone, production, build("v1"));
    expect(gatewayUploads()).toHaveLength(0);
  });
});

describe("a gateway that serves the console as assets", () => {
  const files: Asset[] = [
    { path: "/index.html", hash: "a".repeat(32), size: 2, base64: "aGk=", type: "text/html" },
    { path: "/app.js", hash: "b".repeat(32), size: 3, base64: "MQ==", type: "text/javascript" },
  ];
  let client: ReturnType<typeof createCloudflareClient>;
  let withAssets: GatewayBindings;
  let stored: Asset[] | undefined;

  beforeEach(async () => {
    client = createCloudflareClient({ accountId: "acct", apiToken: "t", fetch: cloud.fetch });
    stored = files;
    // `platform install` sends the console with the gateway's first version.
    const jwt = await uploadAssets(client, GATEWAY, files);
    const first = await client.request<{ id: string }>(
      "POST",
      `/workers/workers/${GATEWAY}/versions`,
      {
        main_module: "worker.js",
        modules: [{ name: "worker.js", content_base64: "" }],
        assets: { jwt, config: GATEWAY_ASSETS_CONFIG },
        bindings: [
          { type: "assets", name: "ASSETS" },
          { type: "d1", name: "DB", id: "db-1" },
        ],
      },
    );
    await client.request("POST", `/workers/scripts/${GATEWAY}/deployments`, {
      strategy: "percentage",
      versions: [{ percentage: 100, version_id: first.id }],
    });
    known = ["ASSETS", "DB"];
    cloud.calls.length = 0;
    withAssets = createGatewayBindings(client, {
      worker: GATEWAY,
      bindings: () => known,
      code: () => "export default {}",
      compatibilityDate: "2026-10-01",
      assets: () => stored,
    });
  });

  it("uploads the assets with the new version, never keep_assets", async () => {
    expect(await withAssets.bind(tool)).toBe(true);
    const upload = cloud.uploads.at(-1)!;
    expect(upload).not.toHaveProperty("keep_assets");
    expect(upload.assets).toMatchObject({ config: GATEWAY_ASSETS_CONFIG });
    expect(upload.bindings).toContainEqual({ type: "assets", name: "ASSETS" });
    expect(upload.bindings).not.toContainEqual({ type: "inherit", name: "ASSETS" });
    expect(upload.bindings).toContainEqual({ type: "inherit", name: "DB" });
    expect(cloud.workers.get(GATEWAY)!.deployed).toBe(gatewayVersions().at(-1)!.id);
  });

  it("fills the buckets Cloudflare asks for when it no longer holds the files", async () => {
    cloud.storedAssets.clear();
    await withAssets.bind(tool);
    expect(cloud.calls).toContain("POST /workers/assets/upload");
    expect(cloud.storedAssets.size).toBe(2);
  });

  it("only registers the manifest when Cloudflare already holds the files", async () => {
    await withAssets.bind(tool);
    expect(cloud.calls).not.toContain("POST /workers/assets/upload");
  });

  it("uploads nothing when the assets cannot be loaded", async () => {
    stored = undefined;
    withAssets = createGatewayBindings(client, {
      worker: GATEWAY,
      bindings: () => known,
      code: () => "export default {}",
      compatibilityDate: "2026-10-01",
      assets: () => {
        throw new Error("run platform install again");
      },
    });
    await expect(withAssets.bind(tool)).rejects.toThrow(/platform install/);
    expect(gatewayUploads()).toHaveLength(0);
  });

  it("is refused by the simulated Cloudflare as by the real one without an assets jwt", async () => {
    const without = createGatewayBindings(client, {
      worker: GATEWAY,
      bindings: () => known.filter((n) => n !== "ASSETS"),
      code: () => "export default {}",
      compatibilityDate: "2026-10-01",
    });
    await expect(without.bind(tool)).rejects.toThrow(/assets\.jwt/);
    await expect(
      client.request("POST", `/workers/workers/${GATEWAY}/versions`, {
        main_module: "worker.js",
        modules: [{ name: "worker.js", content_base64: "" }],
        keep_assets: true,
        bindings: [],
      }),
    ).rejects.toThrow(/Assets cannot be inherited between versions using keep_assets/);
  });
});
