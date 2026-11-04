// The `cloud` mode: a tool is a user Worker in a dispatch namespace of Forgeron's account (Workers
// for Platforms), with its own D1, KV and R2 declared when the code is uploaded (D-009, D-010).
// Neutral: `fetch` only.
//
// Uploading a user Worker to a namespace puts it on traffic at once: there is no version that waits
// for a deployment, as there is in self-host (first uploads are deployed synchronously, Cloudflare
// changelog of 2025-02-20). So `upload` only keeps the build, `migrate` runs, and `activate` sends
// the script. A failed migration then leaves the previous script serving (sdk.md §8, point 4).
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
import {
  createCloudflareClient,
  CloudflareError,
  type CloudflareClient,
  type CloudflareOptions,
} from "../self-host/cloudflare";
import { createRestD1 } from "../self-host/d1-rest";
import { workerName } from "../self-host/names";

export interface CloudOptions extends CloudflareOptions {
  /** Part of every name: the workspace the tool belongs to. */
  workspace: string;
  /** The dispatch namespace the tool Workers are uploaded to. */
  namespace: string;
  /** Where an environment answers, from the name of its Worker. */
  url(workerName: string, environment: Environment): string;
  compatibilityDate?: string;
}

const COMPATIBILITY_DATE = "2026-07-01";

/**
 * Creates the dispatch namespace the tool Workers are uploaded to, if the account has none of that
 * name (`POST /workers/dispatch/namespaces` `{ name }`; Cloudflare documentation, Workers for
 * Platforms "Get started" and "Infrastructure as code", read 2026-11-03). Returns whether it was created.
 */
export async function ensureDispatchNamespace(
  client: CloudflareClient,
  name: string,
): Promise<boolean> {
  try {
    await client.request("GET", `/workers/dispatch/namespaces/${encodeURIComponent(name)}`);
    return false;
  } catch (error) {
    if (!(error instanceof CloudflareError) || error.status !== 404) throw error;
  }
  await client.request("POST", "/workers/dispatch/namespaces", { name });
  return true;
}

export function createCloudHosting(options: CloudOptions): Hosting {
  const client = createCloudflareClient(options);
  const resources = cloudflareResources(client, "cloud");
  const nameOf = (environment: Environment) => workerName(options.workspace, environment);
  const script = (worker: string) =>
    `/workers/dispatch/namespaces/${encodeURIComponent(options.namespace)}/scripts/${encodeURIComponent(worker)}`;

  return {
    async provision(environment, manifest): Promise<Provisioned> {
      const bindings = await resources.provision(nameOf(environment), bindingsOf(manifest));
      return { environment, bindings };
    },

    // Nothing is sent yet: see the note at the top of the file.
    async upload(provisioned, build): Promise<Uploaded> {
      return { provisioned, build };
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

    async openDatabase(environment) {
      const id = await resources.findD1(nameOf(environment));
      return id ? createRestD1(client, id) : undefined;
    },

    async activate(uploaded): Promise<Activation> {
      const worker = nameOf(uploaded.provisioned.environment);
      const form = new FormData();
      // The bindings are declared here, in the metadata of the upload: the Worker's own D1, KV and R2.
      form.append(
        "metadata",
        new Blob(
          [
            JSON.stringify({
              main_module: "worker.js",
              compatibility_date: options.compatibilityDate ?? COMPATIBILITY_DATE,
              bindings: resources.metadata(uploaded.provisioned.bindings),
            }),
          ],
          { type: "application/json" },
        ),
      );
      form.append(
        "worker.js",
        new Blob([uploaded.build.worker], { type: "application/javascript+module" }),
        "worker.js",
      );
      await client.form("PUT", script(worker), form);
      return { url: options.url(worker, uploaded.provisioned.environment) };
    },

    // Deletes the script, then what it was bound to. A half-removed environment can be removed again.
    async teardown(environment): Promise<void> {
      const worker = nameOf(environment);
      try {
        await client.request("DELETE", script(worker));
      } catch (error) {
        if (!(error instanceof CloudflareError) || error.status !== 404) throw error;
      }
      await resources.teardown(worker);
    },
  };
}
