// The D1, KV and R2 of a tool, created and removed through the Cloudflare API. Both Cloudflare modes
// (self-host and cloud) give a tool its own, named after its Worker: `<worker>--db|cache|files`, so a
// resource is found again by name and a half-removed environment can be removed again.
import type { Binding } from "./core";
import { CloudflareError, type CloudflareClient } from "./self-host/cloudflare";

interface Named {
  id?: string;
  uuid?: string;
  name?: string;
  title?: string;
}

export function cloudflareResources(client: CloudflareClient, mode: string) {
  const found = async <T>(path: string, pick: (r: T) => Named[], name: string, key: keyof Named) =>
    pick(await client.request<T>("GET", path)).find((r) => r[key] === name);

  async function ensureD1(name: string): Promise<{ id: string; fresh: boolean }> {
    const existing = await found<Named[]>(
      `/d1/database?name=${encodeURIComponent(name)}`,
      (r) => r,
      name,
      "name",
    );
    if (existing?.uuid) return { id: existing.uuid, fresh: false };
    return {
      id: (await client.request<Named>("POST", "/d1/database", { name })).uuid!,
      fresh: true,
    };
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
    /** Creates what `bindings` ask for, named after the Worker, and gives back where each one is. */
    async provision(worker: string, bindings: Binding[]): Promise<Binding[]> {
      const provisioned: Binding[] = [];
      for (const binding of bindings) {
        const name = `${worker}--${binding.name.toLowerCase()}`;
        if (binding.kind === "d1") {
          const { id, fresh } = await ensureD1(name);
          provisioned.push({ ...binding, id, fresh });
        } else if (binding.kind === "kv") {
          provisioned.push({ ...binding, id: await ensureKv(name) });
        } else if (binding.kind === "r2") {
          provisioned.push({ ...binding, id: await ensureR2(name) });
        } else {
          throw new CloudflareError(
            `The ${binding.kind} resource ${binding.name} cannot be provisioned in ${mode} yet.`,
            501,
          );
        }
      }
      return provisioned;
    },

    /** The `bindings` of a Worker's upload metadata. */
    metadata(bindings: Binding[]): Record<string, unknown>[] {
      return bindings.map((b) =>
        b.kind === "d1"
          ? { type: "d1", name: b.name, id: b.id }
          : b.kind === "kv"
            ? { type: "kv_namespace", name: b.name, namespace_id: b.id }
            : { type: "r2_bucket", name: b.name, bucket_name: b.id },
      );
    },

    /** Deletes the resources named after the Worker, each looked up by name. */
    async teardown(worker: string): Promise<void> {
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
