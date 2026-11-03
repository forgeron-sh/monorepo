import { createRegistry, migratePlatform } from "@forgeron/registry";
import type { D1Database } from "@forgeron/hosting";
import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway } from "../gateway";
import {
  namespaceTarget,
  serviceBindingOf,
  serviceBindingTarget,
  type DispatchNamespace,
} from "./targets";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

describe("serviceBindingOf", () => {
  it("names the binding of a Worker, one to one", () => {
    expect(serviceBindingOf("acme--crm--production")).toBe("TOOL_ACME__CRM__PRODUCTION");
    expect(serviceBindingOf("acme--crm--pr-12")).toBe("TOOL_ACME__CRM__PR_12");
  });
});

describe("serviceBindingTarget", () => {
  const fetcher = { fetch: () => new Response("ok") };

  it("finds the binding of a Worker", () => {
    expect(
      serviceBindingTarget({ TOOL_ACME__CRM__PRODUCTION: fetcher }, "acme--crm--production"),
    ).toBe(fetcher);
  });

  it("does not take another binding for a tool, nor a value that cannot be called", () => {
    expect(serviceBindingTarget({ DB: fetcher }, "db")).toBeUndefined();
    expect(
      serviceBindingTarget({ TOOL_ACME__CRM__PRODUCTION: "text" }, "acme--crm--production"),
    ).toBeUndefined();
    expect(
      serviceBindingTarget({ TOOL_ACME__CRM__PRODUCTION: null }, "acme--crm--production"),
    ).toBeUndefined();
    expect(serviceBindingTarget({}, "acme--crm--production")).toBeUndefined();
  });
});

describe("namespaceTarget", () => {
  const request = new Request("https://acme.forgeron.app/mcp");

  it("forwards to the Worker of that name in the namespace", async () => {
    const asked: string[] = [];
    const namespace: DispatchNamespace = {
      get: (worker) => ({
        fetch: () => {
          asked.push(worker);
          return new Response("ok");
        },
      }),
    };
    expect(
      await (await namespaceTarget(namespace, "acme--crm--production").fetch(request)).text(),
    ).toBe("ok");
    expect(asked).toEqual(["acme--crm--production"]);
  });

  it("answers 502 when the script is gone, and lets any other failure through", async () => {
    const gone: DispatchNamespace = {
      get: () => ({
        fetch: () => {
          throw new Error("Worker not found.");
        },
      }),
    };
    expect((await namespaceTarget(gone, "acme--crm--production").fetch(request)).status).toBe(502);
    const broken: DispatchNamespace = {
      get: () => ({
        fetch: () => {
          throw new Error("boom");
        },
      }),
    };
    await expect(namespaceTarget(broken, "acme--crm--production").fetch(request)).rejects.toThrow(
      "boom",
    );
  });
});

// The same platform, in the two hosting modes: only the way to the tool Workers changes.
describe("the gateway reaches the tool Workers in cloud and in self-host", () => {
  let mf: Miniflare;
  let d1: D1Database;

  beforeAll(async () => {
    mf = new Miniflare({
      modules: true,
      script: "export default { fetch() { return new Response('') } }",
      compatibilityDate: "2026-07-01",
      d1Databases: ["DB"],
    });
    d1 = (await mf.getD1Database("DB")) as unknown as D1Database;
    await migratePlatform(d1);
    const registry = createRegistry(d1);
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    const build = await registry.recordBuild(tool.id, {
      fingerprint: "fp",
      manifest: { name: "crm" },
    });
    const version = await registry.publishVersion(tool.id, build.id, "1.0.0");
    for (const environment of ["production", "pilot"] as const) {
      const slot = await registry.ensureEnvironment(tool.id, environment);
      await registry.activate(slot.id, version.id, { actor: "test" });
    }
  });
  afterAll(() => mf.dispose());

  const worker = (name: string) => ({
    fetch: (request: Request) =>
      Response.json({ worker: name, path: new URL(request.url).pathname }),
  });
  const call = async (env: Record<string, unknown>) => {
    const response = await createGateway({ DB: d1, BASE_DOMAIN: "forgeron.app", ...env })(
      new Request("https://acme.forgeron.app/t/crm/api/deals.list"),
    );
    return { status: response.status, body: await response.json() };
  };

  it("through a dispatch namespace in cloud mode, by the name of the environment's Worker", async () => {
    const asked: string[] = [];
    const DISPATCHER = {
      get: (name: string) => {
        asked.push(name);
        return worker(name);
      },
    };
    expect(await call({ DISPATCHER })).toEqual({
      status: 200,
      body: { worker: "acme--crm--production", path: "/api/deals.list" },
    });
    expect(asked).toEqual(["acme--crm--production"]);
  });

  it("through service bindings in self-host mode", async () => {
    expect(
      await call({
        TOOL_ACME__CRM__PRODUCTION: worker("acme--crm--production"),
        TOOL_ACME__CRM__PILOT: worker("acme--crm--pilot"),
        TOOL_GLOBEX__CRM__PRODUCTION: worker("globex--crm--production"),
      }),
    ).toEqual({
      status: 200,
      body: { worker: "acme--crm--production", path: "/api/deals.list" },
    });
  });

  it("answers 502 in self-host mode when the tool has no binding yet", async () => {
    expect(
      (await call({ TOOL_GLOBEX__CRM__PRODUCTION: worker("globex--crm--production") })).status,
    ).toBe(502);
  });

  it("never reaches another workspace's Worker with a registry that would point to it", async () => {
    const response = await createGateway(
      {
        DB: d1,
        BASE_DOMAIN: "forgeron.app",
        TOOL_GLOBEX__CRM__PRODUCTION: worker("globex--crm--production"),
      },
      { workerNameOf: () => "globex--crm--production" },
    )(new Request("https://acme.forgeron.app/t/crm/mcp"));
    expect(response.status).toBe(500);
  });
});
