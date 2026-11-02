import type { Manifest } from "@forgeron/manifest";
import { afterEach, describe, expect, it } from "vitest";
import type { Build, Environment } from "./index";
import { createLocalHosting, type LocalHosting } from "./local";

// A Worker that echoes what the host forwards: enough to see identity, path and body.
const echo = (version: string) => `
export default {
  async fetch(request) {
    const url = new URL(request.url);
    return Response.json({
      version: ${JSON.stringify(version)},
      method: request.method,
      path: url.pathname + url.search,
      user: JSON.parse(request.headers.get("x-forgeron-user") ?? "null"),
      body: await request.text(),
    });
  },
};
`;

const manifest = {
  name: "crm",
  version: "1.0.0",
  roles: { support: { grants: ["read"] }, admin: { grants: ["admin"] } },
  resources: { cache: {} },
} as unknown as Manifest;

const build = (version: string): Build => ({
  manifest,
  worker: echo(version),
  fingerprint: version,
});
const environment: Environment = { tool: "crm", name: "local" };

let hosting: LocalHosting;
let created = false;
afterEach(async () => {
  if (created) await hosting.close();
  created = false;
});

const open = (options?: Parameters<typeof createLocalHosting>[0]) => {
  hosting = createLocalHosting(options);
  created = true;
  return hosting;
};

async function deploy(version: string, options?: Parameters<typeof createLocalHosting>[0]) {
  if (!created) open(options);
  const provisioned = await hosting.provision(environment, manifest);
  const uploaded = await hosting.upload(provisioned, build(version));
  return hosting.activate(uploaded);
}

const get = async (url: string, init?: RequestInit) =>
  (await fetch(url, init)).json() as Promise<Record<string, unknown>>;

describe("local hosting", () => {
  it("provisions the bindings of the manifest", async () => {
    open();
    expect(await hosting.provision(environment, manifest)).toEqual({
      environment,
      bindings: [{ name: "CACHE", kind: "kv" }],
    });
  });

  it("runs the Worker in workerd and answers on a local URL", async () => {
    const { url } = await deploy("v1");
    expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    expect(await get(`${url}/api/ping?a=1`)).toMatchObject({
      version: "v1",
      path: "/api/ping?a=1",
    });
  });

  it("forwards the method and the body", async () => {
    const { url } = await deploy("v1");
    const answer = await get(`${url}/mcp`, { method: "POST", body: '{"jsonrpc":"2.0"}' });
    expect(answer).toMatchObject({ method: "POST", body: '{"jsonrpc":"2.0"}' });
  });

  it("stands in for the gateway: the developer has every role of the tool", async () => {
    const { url } = await deploy("v1");
    expect((await get(url)).user).toEqual({
      id: "dev",
      email: "dev@localhost",
      name: "Local developer",
      roles: ["support", "admin"],
    });
  });

  it("does not let the caller choose the identity", async () => {
    const { url } = await deploy("v1");
    const spoofed = JSON.stringify({ id: "root", email: "r@x", name: "R", roles: ["root"] });
    const answer = await get(url, { headers: { "x-forgeron-user": spoofed } });
    expect(answer.user).toMatchObject({ id: "dev" });
  });

  it("takes another identity when asked", async () => {
    const { url } = await deploy("v1", {
      identity: () => ({ id: "u9", email: "u@x.fr", name: "U", roles: ["support"] }),
    });
    expect((await get(url)).user).toMatchObject({ id: "u9", roles: ["support"] });
  });

  it("replaces the running build when a new one is activated", async () => {
    const first = await deploy("v1");
    expect((await get(first.url)).version).toBe("v1");
    const second = await deploy("v2");
    expect((await get(second.url)).version).toBe("v2");
    // The URL does not change: a client keeps its address across rebuilds.
    expect(second.url).toBe(first.url);
  });

  it("does not leave workerd running when the port is taken", async () => {
    const first = await deploy("v1");
    const port = Number(new URL(first.url).port);
    const other = createLocalHosting({ port });
    const env: Environment = { tool: "other", name: "local" };
    const provisioned = await other.provision(env, manifest);
    await expect(other.activate(await other.upload(provisioned, build("v2")))).rejects.toThrow(
      /EADDRINUSE/,
    );
    await other.close();
    // The first environment is untouched.
    expect((await get(first.url)).version).toBe("v1");
  });

  it("stops answering after teardown", async () => {
    const { url } = await deploy("v1");
    await hosting.teardown(environment);
    await expect(fetch(url)).rejects.toThrow(/fetch failed/);
  });

  it("teardown of an environment that is not running is a no-op", async () => {
    open();
    await expect(hosting.teardown(environment)).resolves.toBeUndefined();
  });

  it("keeps environments apart", async () => {
    open();
    const activate = async (name: Environment["name"], version: string) => {
      const env: Environment = { tool: "crm", name };
      const provisioned = await hosting.provision(env, manifest);
      return hosting.activate(await hosting.upload(provisioned, build(version)));
    };
    const local = await activate("local", "local-build");
    const preview = await activate("preview", "preview-build");
    expect((await get(local.url)).version).toBe("local-build");
    expect((await get(preview.url)).version).toBe("preview-build");
  });
});
