// Self-host: the gateway reaches a tool's Worker through a service binding `TOOL_<WORKER>` (D-017),
// so creating or deleting a tool Worker means giving the gateway a new version with that binding
// added or removed (D-029). Neutral: `fetch` only.
//
// Cloudflare documentation, Workers API (beta `versions`): a version is an immutable snapshot of
// the code *and* of its bindings, so a version that lists only the new binding would drop `DB`, the
// plain values and the gateway's secret. A secret's value cannot be read back, so the new version
// asks Cloudflare to copy each existing binding from an earlier one with `{ type: "inherit", name }`:
// no value is sent, and an `inherit` that cannot be resolved fails the upload (error 10057) instead
// of silently losing the binding. Without `version_id` the copy comes from the most recently
// uploaded version, which is not always the deployed one; this code uploads and deploys together.
import { GATEWAY_ASSETS_CONFIG, uploadAssets, type Asset } from "./assets";
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
  /**
   * The gateway serves the console as assets. Cloudflare does not let a version inherit the assets
   * of an earlier one (`keep_assets` is refused), so each version uploads them again: this returns
   * the files `platform install` stored, or `undefined` when the gateway serves none. It throws
   * when it cannot say (nothing stored).
   */
  assets?(): readonly Asset[] | undefined | Promise<readonly Asset[] | undefined>;
}

export interface GatewayBindings {
  /** Binds a tool Worker. `false`, with nothing uploaded, if the gateway already has the binding. */
  bind(toolWorker: string): Promise<boolean>;
  /** Removes the binding of a tool Worker. `false` if the gateway has none. */
  unbind(toolWorker: string): Promise<boolean>;
  /**
   * Uploads the gateway as it is now stored (its code and console in the platform D1), every binding
   * it holds carried over and none added, and deploys it at 100 %. The platform updating itself
   * (D-138) stores the new code first and then calls this: the same path as a tool being bound.
   */
  redeploy(): Promise<void>;
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
    const assets = await options.assets?.();
    // The files are already on Cloudflare: it answers with no bucket to fill and the session token
    // completes the upload. The Worker's own `ASSETS` binding is declared, not inherited.
    const jwt = assets ? await uploadAssets(client, options.worker, assets) : undefined;
    const version = await client.request<{ id: string }>(
      "POST",
      `/workers/workers/${options.worker}/versions`,
      {
        main_module: "worker.js",
        compatibility_date: options.compatibilityDate,
        compatibility_flags: [...(options.compatibilityFlags ?? [])],
        ...(jwt ? { assets: { jwt, config: GATEWAY_ASSETS_CONFIG } } : {}),
        modules: [
          {
            name: "worker.js",
            content_type: "application/javascript+module",
            content_base64: base64(await options.code()),
          },
        ],
        bindings: [
          ...(jwt ? [{ type: "assets", name: "ASSETS" }] : []),
          ...names
            .filter((name) => !jwt || name !== "ASSETS")
            .map((name) => ({ type: "inherit", name })),
          ...added,
        ],
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

    async redeploy() {
      await redeploy(await options.bindings(), []);
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
