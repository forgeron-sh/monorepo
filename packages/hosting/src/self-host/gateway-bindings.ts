// Self-host: the gateway reaches a tool's Worker through a service binding `TOOL_<WORKER>` (D-017),
// so creating or deleting a tool Worker means giving the gateway a new version with that binding
// added or removed (D-028). Neutral: `fetch` only.
//
// Cloudflare documentation, Workers API (beta `versions`): a version is an immutable snapshot of
// the code *and* of its bindings, so a version that lists only the new binding would drop `DB`, the
// plain values and the gateway's secret. A secret's value cannot be read back, so the new version
// asks Cloudflare to copy each existing binding from an earlier one with `{ type: "inherit", name }`:
// no value is sent, and an `inherit` that cannot be resolved fails the upload (error 10057) instead
// of silently losing the binding. Without `version_id` the copy comes from the most recently
// uploaded version, which is not always the deployed one; this code uploads and deploys together.
import type { CloudflareClient } from "./cloudflare";
import { serviceBindingName } from "./names";

export interface GatewayBindingsOptions {
  /** The gateway Worker, as created by `forgeron platform install` (`<name>-gateway`). */
  worker: string;
  /**
   * The names of every binding the gateway has now (the keys of its `env`). Each is carried over
   * to the new version; the tool bindings among them are what tells that a Worker is bound.
   */
  bindings(): readonly string[] | Promise<readonly string[]>;
  /** The gateway's own module (`worker.js`): a version cannot be uploaded without code. */
  code(): string | Promise<string>;
  compatibilityDate: string;
  compatibilityFlags?: readonly string[];
}

export interface GatewayBindings {
  /** Binds a tool Worker. `false`, with nothing uploaded, if the gateway already has the binding. */
  bind(toolWorker: string): Promise<boolean>;
  /** Removes the binding of a tool Worker. `false` if the gateway has none. */
  unbind(toolWorker: string): Promise<boolean>;
}

const base64 = (text: string) => {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
};

export function createGatewayBindings(
  client: CloudflareClient,
  options: GatewayBindingsOptions,
): GatewayBindings {
  // Uploads the gateway with exactly `names` carried over, plus `added`, then deploys it.
  async function redeploy(names: readonly string[], added: Record<string, unknown>[]) {
    const version = await client.request<{ id: string }>(
      "POST",
      `/workers/workers/${options.worker}/versions`,
      {
        main_module: "worker.js",
        compatibility_date: options.compatibilityDate,
        compatibility_flags: [...(options.compatibilityFlags ?? [])],
        modules: [
          {
            name: "worker.js",
            content_type: "application/javascript+module",
            content_base64: base64(await options.code()),
          },
        ],
        bindings: [...names.map((name) => ({ type: "inherit", name })), ...added],
      },
    );
    await client.request("POST", `/workers/scripts/${options.worker}/deployments`, {
      strategy: "percentage",
      versions: [{ percentage: 100, version_id: version.id }],
    });
  }

  return {
    async bind(toolWorker) {
      const name = serviceBindingName(toolWorker);
      const names = await options.bindings();
      if (names.includes(name)) return false;
      await redeploy(names, [{ type: "service", name, service: toolWorker }]);
      return true;
    },

    async unbind(toolWorker) {
      const name = serviceBindingName(toolWorker);
      const names = await options.bindings();
      if (!names.includes(name)) return false;
      await redeploy(
        names.filter((n) => n !== name),
        [],
      );
      return true;
    },
  };
}
