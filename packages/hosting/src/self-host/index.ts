// The `self-host` mode: a tool is a classic Worker on the customer's Cloudflare account, created
// through the Cloudflare API, with its own D1, KV and R2 (D-009, D-010). Neutral: `fetch` only.
//
// The Worker is uploaded as a *version*, which serves nothing; `activate` creates the deployment
// that sends all the traffic to it. Between the two, `migrate` runs, so a failed migration leaves
// the previous version serving (sdk.md §8, point 4).
import {
  bindingsOf,
  type Activation,
  type Environment,
  type Hosting,
  type Provisioned,
  type Uploaded,
} from "../core";
import { applyMigrations } from "../migrate";
import { cloudflareResources } from "../resources";
import { createCloudflareClient, CloudflareError, type CloudflareOptions } from "./cloudflare";
import { createRestD1 } from "./d1-rest";
import type { GatewayBindings } from "./gateway-bindings";
import { workerName } from "./names";

export interface SelfHostOptions extends CloudflareOptions {
  /** Part of every name. */
  workspace: string;
  /** Where an environment answers, from the name of its Worker (workers.dev, a route, a custom domain). */
  url(workerName: string): string;
  compatibilityDate?: string;
  /**
   * Gives the gateway a service binding to each tool Worker once it serves, and takes it away
   * before the Worker is deleted (D-029). Without it, binding the tools is somebody else's job.
   */
  gateway?: GatewayBindings;
}

const COMPATIBILITY_DATE = "2026-07-01";

const base64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

export function createSelfHostHosting(options: SelfHostOptions): Hosting {
  const client = createCloudflareClient(options);
  const nameOf = (environment: Environment) => workerName(options.workspace, environment);
  const resources = cloudflareResources(client, "self-host");

  return {
    async provision(environment, manifest): Promise<Provisioned> {
      const worker = nameOf(environment);
      const bindings = await resources.provision(worker, bindingsOf(manifest));
      // The Worker exists before its first version: a Worker is a resource of its own.
      try {
        await client.request("GET", `/workers/workers/${worker}`);
      } catch (error) {
        if (!(error instanceof CloudflareError) || error.status !== 404) throw error;
        await client.request("POST", "/workers/workers", { name: worker });
      }
      return { environment, bindings };
    },

    async upload(provisioned, build): Promise<Uploaded> {
      const worker = nameOf(provisioned.environment);
      const version = await client.request<{ id: string }>(
        "POST",
        `/workers/workers/${worker}/versions`,
        {
          main_module: "worker.js",
          compatibility_date: options.compatibilityDate ?? COMPATIBILITY_DATE,
          modules: [
            {
              name: "worker.js",
              content_type: "application/javascript+module",
              content_base64: base64(build.worker),
            },
          ],
          bindings: resources.metadata(provisioned.bindings),
        },
      );
      return { provisioned, build, versionId: version.id };
    },

    async migrate(uploaded, migrateOptions) {
      const db = uploaded.provisioned.bindings.find((b) => b.kind === "d1");
      if (!db?.id) return { applied: [] };
      return applyMigrations(
        createRestD1(client, db.id),
        uploaded.build.migrations ?? [],
        migrateOptions,
      );
    },

    database(provisioned) {
      const db = provisioned.bindings.find((b) => b.kind === "d1");
      return db?.id ? createRestD1(client, db.id) : undefined;
    },

    async activate(uploaded): Promise<Activation> {
      const worker = nameOf(uploaded.provisioned.environment);
      await client.request("POST", `/workers/scripts/${worker}/deployments`, {
        strategy: "percentage",
        versions: [{ percentage: 100, version_id: uploaded.versionId }],
      });
      await options.gateway?.bind(worker);
      return { url: options.url(worker) };
    },

    // Deletes the Worker, then what it was bound to. Each is looked up by name: there may be no
    // memory of the ids, and a half-removed environment can be removed again.
    async teardown(environment): Promise<void> {
      const worker = nameOf(environment);
      // The gateway lets go first: a service binding to a Worker that is gone cannot be deployed.
      await options.gateway?.unbind(worker);
      try {
        await client.request("DELETE", `/workers/workers/${worker}`);
      } catch (error) {
        if (!(error instanceof CloudflareError) || error.status !== 404) throw error;
      }
      await resources.teardown(worker);
    },
  };
}

export { CloudflareError, createCloudflareClient } from "./cloudflare";
export type { CloudflareClient, CloudflareOptions } from "./cloudflare";
export { GATEWAY_ASSETS_CONFIG, uploadAssets } from "./assets";
export type { Asset } from "./assets";
export { createRestD1 } from "./d1-rest";
export { createGatewayBindings } from "./gateway-bindings";
export type { GatewayBindings, GatewayBindingsOptions } from "./gateway-bindings";
export { serviceBindingName, workerName } from "./names";
