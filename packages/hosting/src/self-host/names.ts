// One stable name per tool and per environment, so that publishing a version changes no link
// (docs/ARCHITECTURE.md, "Naming of Workers and databases"): `<workspace>--<tool>--<environment>`.
import type { Environment } from "../core";

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

// FNV-1a, 32 bits: enough to tell two branches apart once a long name is cut.
function shortHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 6);
}

// A Worker name is at most 63 characters.
const MAX = 63;

/** The name of the Worker, and of the resources named after it. A preview is named after its branch. */
export function workerName(workspace: string, environment: Environment): string {
  const stage =
    environment.name === "preview"
      ? `preview-${slug(environment.branch ?? "")}-${shortHash(environment.branch ?? "")}`
      : environment.name;
  const prefix = `${slug(workspace)}--${slug(environment.tool)}--`;
  const name = `${prefix}${stage}`;
  if (name.length <= MAX) return name;
  // Cut the part that varies the most, never the hash that tells previews apart.
  const hash = shortHash(name);
  return `${name.slice(0, MAX - 7).replace(/-+$/, "")}-${hash}`;
}

/**
 * The name of the service binding the gateway holds for a Worker: `acme--crm--production` is
 * `TOOL_ACME__CRM__PRODUCTION`. Worker names are `[a-z0-9-]`, so the mapping is one to one and no
 * other binding of the gateway (`DB`, `BASE_DOMAIN`…) can be taken for a tool (D-017).
 */
export const serviceBindingName = (worker: string): string =>
  `TOOL_${worker.toUpperCase().replaceAll("-", "_")}`;
