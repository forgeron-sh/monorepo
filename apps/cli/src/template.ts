import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { UsageError } from "./io";
import { writeProject } from "./project";
import { WORKFLOW, WORKFLOW_PATH } from "./workflow";

export const SDK_VERSION = "0.0.0";
export const VITEST_VERSION = "5.0.5";

// Catalog templates are npm packages `@forgeron/template-<name>` (docs/sdk.md §18).
// `forgeron init --template <name>` reads the registry's metadata, downloads the tarball and unpacks it.

const DEFAULT_REGISTRY = "https://registry.npmjs.org";

export interface TemplatePackage {
  version: string;
  /** Package files by relative path (the tarball's `package/` prefix removed). */
  files: Map<string, Uint8Array>;
}

export async function fetchTemplate(
  name: string,
  registry = process.env.FORGERON_REGISTRY ?? DEFAULT_REGISTRY,
): Promise<TemplatePackage> {
  const base = registry.replace(/\/+$/, "");
  const meta = await get(`${base}/@forgeron%2Ftemplate-${name}/latest`, name);
  const info = (await meta.json()) as { version?: unknown; dist?: { tarball?: unknown } };
  if (typeof info.version !== "string" || typeof info.dist?.tarball !== "string") {
    throw new UsageError(`The registry's answer for template "${name}" is not a package version.`);
  }
  const tarball = await get(info.dist.tarball, name);
  return {
    version: info.version,
    files: untar(gunzipSync(new Uint8Array(await tarball.arrayBuffer()))),
  };
}

async function get(url: string, name: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new UsageError(
      `Cannot reach the registry for template "${name}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (response.status === 404) {
    throw new UsageError(
      `No template named "${name}": @forgeron/template-${name} is not published.`,
    );
  }
  if (!response.ok) {
    throw new UsageError(`The registry answered ${response.status} for template "${name}".`);
  }
  return response;
}

/** Reads the regular files of a tar archive (ustar, as npm writes it). */
function untar(tar: Uint8Array): Map<string, Uint8Array> {
  const files = new Map<string, Uint8Array>();
  const text = (from: number, length: number) =>
    new TextDecoder().decode(tar.subarray(from, from + length)).replace(/\0.*$/s, "");
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const path = text(offset, 100);
    if (path === "") break;
    const size = Number.parseInt(text(offset + 124, 12).trim() || "0", 8);
    const type = text(offset + 156, 1);
    const prefix = text(offset + 345, 155);
    offset += 512;
    if (type === "0" || type === "") {
      const full = prefix ? `${prefix}/${path}` : path;
      const relative = full.replace(/^[^/]+\//, "");
      if (relative.split("/").includes("..")) {
        throw new UsageError(`The template contains an unsafe path: ${full}`);
      }
      files.set(relative, tar.slice(offset, offset + size));
    }
    offset += Math.ceil(size / 512) * 512;
  }
  return files;
}

export interface CatalogEntry {
  /** The template's name, without the `@forgeron/template-` prefix. */
  name: string;
  version: string;
  description: string;
}

const PREFIX = "@forgeron/template-";

/** Templates of the catalog whose name or description contains `text`. */
export async function searchCatalog(
  text: string,
  registry = process.env.FORGERON_REGISTRY ?? DEFAULT_REGISTRY,
): Promise<CatalogEntry[]> {
  const base = registry.replace(/\/+$/, "");
  const query = new URLSearchParams({ text: `scope:forgeron ${text}`, size: "250" });
  const response = await get(`${base}/-/v1/search?${query}`, text);
  const body = (await response.json()) as {
    objects?: Array<{ package?: { name?: string; version?: string; description?: string } }>;
  };
  const needle = text.toLowerCase();
  const entries: CatalogEntry[] = [];
  for (const { package: pkg } of body.objects ?? []) {
    if (!pkg?.name?.startsWith(PREFIX) || typeof pkg.version !== "string") continue;
    const name = pkg.name.slice(PREFIX.length);
    const description = pkg.description ?? "";
    if (`${name} ${description}`.toLowerCase().includes(needle)) {
      entries.push({ name, version: pkg.version, description });
    }
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

/** The manifest the package ships (`forgeron build` wrote it before packing), if any. */
export const TEMPLATE_MANIFEST = ".forgeron/build/manifest.json";

/** Writes a downloaded template as the tool `name` in `dir`, then links it (`.forgeron/project.json`). */
export async function writeTemplate(
  dir: string,
  name: string,
  templateName: string,
  template: TemplatePackage,
): Promise<void> {
  for (const [path, content] of template.files) {
    if (path === "package.json" || path.startsWith(".forgeron/build/")) continue;
    await mkdir(join(dir, path, ".."), { recursive: true });
    // The tool carries the name chosen here, not the template's.
    const body =
      path === "forgeron.config.ts"
        ? new TextEncoder().encode(
            new TextDecoder().decode(content).replace(`name: "${templateName}"`, `name: "${name}"`),
          )
        : content;
    await writeFile(join(dir, path), body);
  }
  const pkg = JSON.parse(
    new TextDecoder().decode(template.files.get("package.json") ?? new Uint8Array()) || "{}",
  ) as { dependencies?: Record<string, string> };
  await writeFile(
    join(dir, "package.json"),
    `${JSON.stringify(
      {
        name,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: { build: "forgeron build", dev: "forgeron dev", test: "forgeron test" },
        dependencies: pkg.dependencies ?? { "@forgeron/sdk": SDK_VERSION },
        devDependencies: { vitest: VITEST_VERSION },
      },
      null,
      2,
    )}\n`,
  );
  await mkdir(join(dir, ".forgeron"), { recursive: true });
  await writeFile(join(dir, ".forgeron/.gitignore"), "local/\ngenerated/\nbuild/\n");
  await mkdir(join(dir, WORKFLOW_PATH, ".."), { recursive: true });
  await writeFile(join(dir, WORKFLOW_PATH), WORKFLOW);
  await writeProject(dir, { tool: name });
}
