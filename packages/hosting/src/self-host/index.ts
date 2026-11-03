// The `self-host` mode: a tool is a classic Worker on the customer's Cloudflare account, created
// through the Cloudflare API, with its own D1, KV and R2 (D-009, D-010). Neutral: `fetch` only.
//
// The Worker is uploaded as a *version*, which serves nothing; `activate` creates the deployment
// that sends all the traffic to it. Between the two, `migrate` runs, so a failed migration leaves
// the previous version serving (sdk.md §8, point 4).
import {
  bindingsOf,
  type Activation,
  type Binding,
  type Environment,
  type Hosting,
  type Provisioned,
  type Uploaded,
} from "../core";
import { applyMigrations } from "../migrate";
import { createCloudflareClient, CloudflareError, type CloudflareOptions } from "./cloudflare";
import { createRestD1 } from "./d1-rest";
import { workerName } from "./names";

export interface SelfHostOptions extends CloudflareOptions {
  /** Part of every name. */
  workspace: string;
  /** Where an environment answers, from the name of its Worker (workers.dev, a route, a custom domain). */
  url(workerName: string): string;
  compatibilityDate?: string;
}

const COMPATIBILITY_DATE = "2026-07-01";

const base64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

interface Named {
  id?: string;
  uuid?: string;
  name?: string;
  title?: string;
}

export function createSelfHostHosting(options: SelfHostOptions): Hosting {
  const client = createCloudflareClient(options);
  const nameOf = (environment: Environment) => workerName(options.workspace, environment);
  // The resource of a binding is named after the Worker: `<worker>--db`, `--cache`, `--files`.
  const resourceName = (environment: Environment, binding: Binding) =>
    `${nameOf(environment)}--${binding.name.toLowerCase()}`;

  const found = async <T>(path: string, pick: (r: T) => Named[], name: string, key: keyof Named) =>
    pick(await client.request<T>("GET", path)).find((r) => r[key] === name);

  async function ensureD1(name: string): Promise<string> {
    const existing = await found<Named[]>(
      `/d1/database?name=${encodeURIComponent(name)}`,
      (r) => r,
      name,
      "name",
    );
    if (existing?.uuid) return existing.uuid;
    return (await client.request<Named>("POST", "/d1/database", { name })).uuid!;
  }

  async function ensureKv(title: string): Promise<string> {
    const existing = await found<Named[]>(
      "/storage/kv/namespaces?per_page=100",
      (r) => r,
      title,
      "title",
    );
    if (existing?.id) return existing.id;
    return (await client.request<Named>("POST", "/storage/kv/namespaces", { title })).id!;
  }

  async function ensureR2(name: string): Promise<string> {
    const existing = await found<{ buckets: Named[] }>(
      "/r2/buckets",
      (r) => r.buckets,
      name,
      "name",
    );
    if (!existing) await client.request("POST", "/r2/buckets", { name });
    return name;
  }

  async function dropIfFound(path: string, id: string | undefined) {
    if (id) await client.request("DELETE", `${path}/${id}`);
  }

  return {
    async provision(environment, manifest): Promise<Provisioned> {
      const bindings: Binding[] = [];
      for (const binding of bindingsOf(manifest)) {
        const name = resourceName(environment, binding);
        if (binding.kind === "d1") bindings.push({ ...binding, id: await ensureD1(name) });
        else if (binding.kind === "kv") bindings.push({ ...binding, id: await ensureKv(name) });
        else if (binding.kind === "r2") bindings.push({ ...binding, id: await ensureR2(name) });
        else {
          throw new CloudflareError(
            `The ${binding.kind} resource ${binding.name} cannot be provisioned in self-host yet.`,
            501,
          );
        }
      }
      // The Worker exists before its first version: a Worker is a resource of its own.
      const worker = nameOf(environment);
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
          bindings: provisioned.bindings.map((b) =>
            b.kind === "d1"
              ? { type: "d1", name: b.name, id: b.id }
              : b.kind === "kv"
                ? { type: "kv_namespace", name: b.name, namespace_id: b.id }
                : { type: "r2_bucket", name: b.name, bucket_name: b.id },
          ),
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

    async activate(uploaded): Promise<Activation> {
      const worker = nameOf(uploaded.provisioned.environment);
      await client.request("POST", `/workers/scripts/${worker}/deployments`, {
        strategy: "percentage",
        versions: [{ percentage: 100, version_id: uploaded.versionId }],
      });
      return { url: options.url(worker) };
    },

    // Deletes the Worker, then what it was bound to. Each is looked up by name: there may be no
    // memory of the ids, and a half-removed environment can be removed again.
    async teardown(environment): Promise<void> {
      const worker = nameOf(environment);
      try {
        await client.request("DELETE", `/workers/workers/${worker}`);
      } catch (error) {
        if (!(error instanceof CloudflareError) || error.status !== 404) throw error;
      }
      const resource = (suffix: string) => `${worker}--${suffix}`;
      const d1 = await found<Named[]>(
        `/d1/database?name=${encodeURIComponent(resource("db"))}`,
        (r) => r,
        resource("db"),
        "name",
      );
      await dropIfFound("/d1/database", d1?.uuid);
      const kv = await found<Named[]>(
        "/storage/kv/namespaces?per_page=100",
        (r) => r,
        resource("cache"),
        "title",
      );
      await dropIfFound("/storage/kv/namespaces", kv?.id);
      const r2 = await found<{ buckets: Named[] }>(
        "/r2/buckets",
        (r) => r.buckets,
        resource("files"),
        "name",
      );
      await dropIfFound("/r2/buckets", r2?.name);
    },
  };
}

export { CloudflareError, createCloudflareClient } from "./cloudflare";
export type { CloudflareClient, CloudflareOptions } from "./cloudflare";
export { createRestD1 } from "./d1-rest";
export { workerName } from "./names";
