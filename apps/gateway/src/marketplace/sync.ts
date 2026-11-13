// Bringing a marketplace's tools into the registry (D-116). For each tool of the index that has a
// release, a version the registry does not hold yet is downloaded, checked as untrusted code (the
// hash the index gives, the bundle's shape, the manifest's schema, its name and version against the
// index, the documentation against the manifest), then recorded in the marketplace's hidden workspace
// with the calls a deployment uses. A tool refused does not stop the others.
import { BUNDLE_FORMAT, type BuildDocs } from "@forgeron/hosting";
import { ManifestSchema, type MarketplaceTool } from "@forgeron/manifest";
import { docsProblem, type Registry } from "@forgeron/registry";
import { downloadAsset, MarketplaceError, readIndex, type GitHubReader } from "./github";

export type SyncPort = Pick<
  Registry,
  "findTool" | "createTool" | "recordBuild" | "storeDocs" | "publishVersion" | "findVersion"
>;

interface SyncedTool {
  name: string;
  version: string;
  /** `added`: recorded now; `current`: already there; `unpublished`: no release yet; `refused`: see `reason`. */
  status: "added" | "current" | "unpublished" | "refused";
  reason?: string;
}

export interface SyncReport {
  title?: string;
  tools: SyncedTool[];
}

const hex = async (bytes: Uint8Array) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

import { viewsProblem } from "../views/check";

/** The bundle's build, or why it is refused. */
async function checkBundle(entry: MarketplaceTool, bytes: Uint8Array) {
  if ((await hex(bytes)) !== entry.sha256) {
    throw new MarketplaceError("the file is not the one the index lists (SHA-256 differs)");
  }
  let bundle: Record<string, unknown>;
  try {
    bundle = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
  } catch {
    throw new MarketplaceError("the file is not JSON");
  }
  if (bundle.format !== BUNDLE_FORMAT)
    throw new MarketplaceError(`the file is not a ${BUNDLE_FORMAT}`);
  if (bundle.name !== entry.name || bundle.version !== entry.version) {
    throw new MarketplaceError("the file names another tool or version than the index");
  }
  const build = bundle.build as Record<string, unknown> | undefined;
  if (!build || typeof build.worker !== "string" || typeof build.fingerprint !== "string") {
    throw new MarketplaceError("the file has no Worker or no fingerprint");
  }
  const manifest = ManifestSchema.safeParse(build.manifest);
  if (!manifest.success) throw new MarketplaceError("the manifest is not valid");
  if (manifest.data.name !== entry.name || manifest.data.version !== entry.version) {
    throw new MarketplaceError("the manifest names another tool or version than the index");
  }
  const docs = build.docs as BuildDocs | undefined;
  const problem = await docsProblem(manifest.data, docs);
  if (problem) throw new MarketplaceError(problem);
  const views = viewsProblem(build.views);
  if (typeof views === "string") throw new MarketplaceError(views);
  return {
    manifest: manifest.data,
    worker: build.worker,
    fingerprint: build.fingerprint,
    migrations: build.migrations,
    changelog: build.changelog,
    docs,
    views,
  };
}

export async function syncMarketplace(
  registry: SyncPort,
  source: string,
  reader: GitHubReader,
): Promise<SyncReport> {
  const index = await readIndex(reader);
  const tools: SyncedTool[] = [];
  const seen = new Set<string>();
  for (const entry of index.tools) {
    const line = { name: entry.name, version: entry.version };
    if (seen.has(entry.name)) {
      tools.push({ ...line, status: "refused", reason: "listed twice in the index" });
      continue;
    }
    seen.add(entry.name);
    if (!entry.release || !entry.asset || !entry.sha256) {
      tools.push({ ...line, status: "unpublished" });
      continue;
    }
    const existing = await registry.findTool(source, entry.name);
    if (existing && (await registry.findVersion(existing.id, entry.version))) {
      tools.push({ ...line, status: "current" });
      continue;
    }
    try {
      const build = await checkBundle(
        entry,
        // A tool published from its own repository (D-121) is read there, with the same token.
        await downloadAsset(
          entry.repo ? { ...reader, repo: entry.repo } : reader,
          entry.release,
          entry.asset,
        ),
      );
      const tool = existing ?? (await registry.createTool({ workspace: source, name: entry.name }));
      const recorded = await registry.recordBuild(tool.id, {
        fingerprint: build.fingerprint,
        manifest: build.manifest,
        worker: build.worker,
        ...(build.migrations !== undefined ? { migrations: build.migrations } : {}),
        ...(build.changelog !== undefined ? { changelog: build.changelog } : {}),
        ...(build.views ? { views: build.views } : {}),
      });
      if (build.docs) await registry.storeDocs(tool.id, recorded.id, build.docs);
      await registry.publishVersion(tool.id, recorded.id, entry.version);
      tools.push({ ...line, status: "added" });
    } catch (error) {
      if (!(error instanceof MarketplaceError)) throw error;
      tools.push({ ...line, status: "refused", reason: error.message });
    }
  }
  return { ...(index.title ? { title: index.title } : {}), tools };
}
