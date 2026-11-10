// The template catalogue (D-081): the tools of the reserved workspace `@templates`, published with
// the calls a deployment uses (a build, its docs, a version). Installing one copies its latest version
// into a workspace as a new tool, in one batch with the audit line. Nothing is deployed: the tool has
// a version and its pending approvals, and goes to an environment through the usual promotion.
//
// The batch writes rows of the catalog and approvals modules on purpose: a half-made install (a tool
// without its approval requests) would let a promotion skip the approvals, so the rows and the audit
// line must be one transaction.
import { diffResourceChanges, type Manifest } from "@forgeron/manifest";
import { RegistryError } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import type { Catalog } from "../catalog/public";
import {
  TEMPLATE_WORKSPACE,
  type AvailableUpdate,
  type DescribedTemplate,
  type InstalledTemplate,
  type InstallPlan,
  type InstallPlanRefusal,
  type Template,
  type ToolSource,
} from "./types";

/** How long an install plan lives (D-092). */
const INSTALL_PLAN_TTL_MS = 15 * 60 * 1000;

/**
 * Where a tool can be installed from: the official catalogue (`@templates`, D-081) or a marketplace a
 * workspace added (`@mp:<id>`, D-116). Both are hidden workspaces of the same registry.
 */
const SOURCE = /^@mp:[A-Za-z0-9-]{1,64}$/;
function sourceOf(source: string | undefined): string {
  const found = source ?? TEMPLATE_WORKSPACE;
  if (found !== TEMPLATE_WORKSPACE && !SOURCE.test(found)) {
    throw new RegistryError("INVALID", `${found} is not a catalogue.`);
  }
  return found;
}
const isSource = (workspace: string) => workspace === TEMPLATE_WORKSPACE || SOURCE.test(workspace);

/** What this module asks of the catalog: narrow, and only through its public API. */
export type CatalogPort = Pick<
  Catalog["api"],
  | "findTool"
  | "listTools"
  | "listVersions"
  | "getBuild"
  | "getVersion"
  | "findVersion"
  | "listEnvironments"
  | "readmeOf"
  | "guideOf"
>;

const toSource = (row: Record<string, unknown>): ToolSource => ({
  kind: row.kind === "marketplace" ? "marketplace" : "repo",
  ...(row.source ? { source: String(row.source) } : {}),
  ...(row.source_tool ? { sourceTool: String(row.source_tool) } : {}),
  ...(row.repo ? { repo: String(row.repo) } : {}),
  productionBranch: String(row.production_branch ?? "main"),
  autoUpdate: Number(row.auto_update) === 1,
  recorded: true,
});

/** A tool deployed before sources (D-121): a repository on `main`, updated by hand. */
const DEFAULT_SOURCE: ToolSource = {
  kind: "repo",
  productionBranch: "main",
  autoUpdate: false,
  recorded: false,
};

export function createTemplates(kernel: Kernel, catalog: CatalogPort) {
  const { d1, now, newId, first, auditStatement } = kernel;

  /** The latest version of a template and the manifest of its build, if it has one. */
  async function latest(toolId: string) {
    const version = (await catalog.listVersions(toolId)).at(-1);
    const build = version ? await catalog.getBuild(version.buildId) : undefined;
    return version && build ? { version, build } : undefined;
  }

  /** The manifest production serves, if any: what a new version's approvals are compared with. */
  async function productionManifest(toolId: string): Promise<Manifest | undefined> {
    const production = (await catalog.listEnvironments(toolId)).find(
      (e) => e.name === "production" && e.versionId,
    );
    const served = production?.versionId
      ? await catalog.getVersion(production.versionId)
      : undefined;
    const build = served ? await catalog.getBuild(served.buildId) : undefined;
    return build?.manifest as Manifest | undefined;
  }

  /**
   * The statements that copy a catalogue version into a tool: the build (code, migrations,
   * changelog), its docs, the version under the same number, and one approval request per resource.
   * The content is keyed by tool and hash: copied by the database, never read here.
   */
  function copyVersion(input: {
    toolId: string;
    fromToolId: string;
    fromBuildId: string;
    version: string;
    requests: Array<{ resource: string; kind: string }>;
    at: string;
  }) {
    const buildId = newId();
    const versionId = newId();
    const { toolId, at } = input;
    return {
      versionId,
      statements: [
        d1
          .prepare(
            `INSERT INTO "builds" ("id", "tool_id", "fingerprint", "manifest", "changelog", "worker", "migrations", "created_at") SELECT ?, ?, "fingerprint", "manifest", "changelog", "worker", "migrations", ? FROM "builds" WHERE "id" = ?`,
          )
          .bind(buildId, toolId, at, input.fromBuildId),
        d1
          .prepare(
            `INSERT OR IGNORE INTO "docs_blobs" ("tool_id", "hash", "part", "content") SELECT ?, "hash", "part", "content" FROM "docs_blobs" WHERE "tool_id" = ?`,
          )
          .bind(toolId, input.fromToolId),
        d1
          .prepare(
            `INSERT INTO "build_docs" ("build_id", "path", "hash", "type", "size") SELECT ?, "path", "hash", "type", "size" FROM "build_docs" WHERE "build_id" = ?`,
          )
          .bind(buildId, input.fromBuildId),
        d1
          .prepare(
            `INSERT INTO "versions" ("id", "tool_id", "build_id", "version", "created_at") VALUES (?, ?, ?, ?, ?)`,
          )
          .bind(versionId, toolId, buildId, input.version, at),
        ...input.requests.map((r) =>
          d1
            .prepare(
              `INSERT INTO "approvals" ("id", "tool_id", "version_id", "resource", "kind", "requested_at") VALUES (?, ?, ?, ?, ?, ?)`,
            )
            .bind(newId(), toolId, versionId, r.resource, r.kind, at),
        ),
      ],
    };
  }

  async function sourceRow(toolId: string) {
    return first(`SELECT * FROM "tool_sources" WHERE "tool_id" = ?`, toolId);
  }

  return {
    // ---- template catalogue
    /**
     * The templates of a catalogue (the official one by default), by name. A tool of the catalogue
     * with no version is not one yet.
     */
    async listTemplates(source?: string): Promise<Template[]> {
      const templates: Template[] = [];
      for (const tool of await catalog.listTools(sourceOf(source))) {
        const found = await latest(tool.id);
        if (!found) continue;
        const manifest = found.build.manifest as Manifest;
        templates.push({
          name: tool.name,
          version: found.version.version,
          resources: diffResourceChanges({}, manifest.resources ?? {}).map((c) => c.subject),
        });
      }
      return templates;
    },

    /**
     * What an admin reads before installing (D-116): the latest version of one tool of a catalogue,
     * its manifest, README, guide and changelog. `undefined` for no such tool or one with no version.
     */
    async describeTemplate(name: string, source?: string): Promise<DescribedTemplate | undefined> {
      const tool = await catalog.findTool(sourceOf(source), name);
      const found = tool ? await latest(tool.id) : undefined;
      if (!tool || !found) return undefined;
      const manifest = found.build.manifest as Manifest;
      const readme = await catalog.readmeOf(tool.id, found.build.id);
      const guide = await catalog.guideOf(tool.id, found.build.id);
      return {
        name,
        version: found.version.version,
        publishedAt: found.version.createdAt,
        manifest,
        resources: diffResourceChanges({}, manifest.resources ?? {}).map((c) => c.subject),
        ...(readme !== undefined ? { readme } : {}),
        ...(guide !== undefined ? { guide } : {}),
        changelog:
          (found.build.changelog as { entries?: unknown[] } | null | undefined)?.entries ?? [],
      };
    },

    /**
     * Creates a tool in `workspace` from the latest version of a template: the tool, a copy of the
     * build (code, migrations, changelog), the docs, the version under the same number, one pending
     * approval for each resource the template asks for, and the audit line, in one batch. The tool
     * has no environment: nothing runs until it is promoted, and production waits for the approvals.
     */
    async installTemplate(input: {
      workspace: string;
      template: string;
      actor: string;
      via?: string;
      /** The catalogue to install from: `@templates` (default) or a marketplace's `@mp:<id>`. */
      source?: string;
    }): Promise<InstalledTemplate> {
      const from = sourceOf(input.source);
      if (isSource(input.workspace)) {
        throw new RegistryError("INVALID", "A catalogue is not a workspace.");
      }
      const source = await catalog.findTool(from, input.template);
      const found = source ? await latest(source.id) : undefined;
      if (!source || !found) {
        throw new RegistryError("NOT_FOUND", `There is no template ${input.template}.`);
      }
      if (await catalog.findTool(input.workspace, input.template)) {
        throw new RegistryError(
          "ALREADY_EXISTS",
          `The workspace ${input.workspace} already has a tool ${input.template}.`,
        );
      }
      if (found.build.worker === undefined) {
        throw new RegistryError(
          "NO_ARTIFACT",
          `The template ${input.template} was recorded without its code.`,
        );
      }
      const manifest = found.build.manifest as Manifest;
      const requests = diffResourceChanges({}, manifest.resources ?? {})
        .filter((c) => c.needsApproval)
        .map((c) => ({ resource: c.subject, kind: c.kind }));

      const at = now();
      const toolId = newId();
      const copy = copyVersion({
        toolId,
        fromToolId: source.id,
        fromBuildId: found.build.id,
        version: found.version.version,
        requests,
        at,
      });
      const versionId = copy.versionId;
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "tools" ("id", "workspace", "name", "created_at") VALUES (?, ?, ?, ?)`,
          )
          .bind(toolId, input.workspace, input.template, at),
        ...copy.statements,
        // Where it came from (D-121): what a later update reads.
        d1
          .prepare(
            `INSERT INTO "tool_sources" ("tool_id", "kind", "source", "source_tool", "updated_by", "updated_at") VALUES (?, 'marketplace', ?, ?, ?, ?)`,
          )
          .bind(toolId, from, input.template, input.actor, at),
        // Nobody may add it to their library until an admin says who (D-117).
        d1
          .prepare(
            `INSERT INTO "tool_availability" ("tool_id", "mode", "subjects", "updated_by", "updated_at") VALUES (?, 'nobody', '[]', ?, ?)`,
          )
          .bind(toolId, input.actor, at),
        auditStatement(
          {
            toolId,
            actor: input.actor,
            ...(input.via ? { via: input.via } : {}),
            kind: "install",
            subject: `${input.template}:${found.version.version}`,
            versionId,
            detail: {
              template: input.template,
              workspace: input.workspace,
              ...(from === TEMPLATE_WORKSPACE ? {} : { source: from }),
            },
          },
          at,
        ),
      ]);
      // A second install that raced this one fails the batch on the unique name: nothing is written.
      return {
        tool: { id: toolId, name: input.template },
        version: { id: versionId, version: found.version.version },
        approvals: requests,
      };
    },

    // ---- where a tool comes from, and its updates (D-121)
    /** The tool's source; a tool deployed before sources reads as a repository on `main`. */
    async toolSource(toolId: string): Promise<ToolSource> {
      const row = await sourceRow(toolId);
      return row ? toSource(row) : DEFAULT_SOURCE;
    },

    /** The tools of a workspace installed from a catalogue that update by themselves (D-121). */
    async autoUpdatingFrom(workspace: string, source: string): Promise<string[]> {
      const rows = await kernel.all(
        `SELECT t."name" FROM "tool_sources" s JOIN "tools" t ON t."id" = s."tool_id" WHERE t."workspace" = ? AND s."kind" = 'marketplace' AND s."source" = ? AND s."auto_update" = 1 ORDER BY t."name"`,
        workspace,
        source,
      );
      return rows.map((r) => String(r.name));
    },

    /** The tool is deployed by a repository's CI: which repository, which branch is production's. */
    async linkRepository(input: {
      toolId: string;
      repo: string;
      productionBranch: string;
      actor: string;
    }): Promise<ToolSource> {
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "tool_sources" ("tool_id", "kind", "repo", "production_branch", "updated_by", "updated_at") VALUES (?, 'repo', ?, ?, ?, ?) ON CONFLICT ("tool_id") DO UPDATE SET "kind" = 'repo', "source" = NULL, "source_tool" = NULL, "repo" = excluded."repo", "production_branch" = excluded."production_branch", "updated_by" = excluded."updated_by", "updated_at" = excluded."updated_at"`,
          )
          .bind(input.toolId, input.repo, input.productionBranch, input.actor, at),
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.actor,
            kind: "access",
            subject: `source:${input.repo}`,
            detail: { event: "repository-linked", productionBranch: input.productionBranch },
          },
          at,
        ),
      ]);
      return this.toolSource(input.toolId);
    },

    /** Whether new versions go to production by itself, and which branch is production's. */
    async setToolSource(input: {
      toolId: string;
      autoUpdate?: boolean;
      productionBranch?: string;
      actor: string;
    }): Promise<ToolSource> {
      const current = await this.toolSource(input.toolId);
      const autoUpdate = input.autoUpdate ?? current.autoUpdate;
      const branch = input.productionBranch ?? current.productionBranch;
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "tool_sources" ("tool_id", "kind", "production_branch", "auto_update", "updated_by", "updated_at") VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT ("tool_id") DO UPDATE SET "production_branch" = excluded."production_branch", "auto_update" = excluded."auto_update", "updated_by" = excluded."updated_by", "updated_at" = excluded."updated_at"`,
          )
          .bind(input.toolId, current.kind, branch, autoUpdate ? 1 : 0, input.actor, at),
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.actor,
            kind: "access",
            subject: "source",
            detail: { event: "source-settings", autoUpdate, productionBranch: branch },
          },
          at,
        ),
      ]);
      return this.toolSource(input.toolId);
    },

    /**
     * The version the tool could move to, or `undefined`. A marketplace tool: the catalogue's latest
     * version, when the tool does not have it yet. A repository tool: the version the preview of its
     * production branch serves, when production serves another.
     */
    async availableUpdate(toolId: string): Promise<AvailableUpdate | undefined> {
      const source = await this.toolSource(toolId);
      if (source.kind === "marketplace") {
        if (!source.source || !source.sourceTool) return undefined;
        const from = await catalog.findTool(source.source, source.sourceTool);
        const found = from ? await latest(from.id) : undefined;
        if (!found) return undefined;
        if (await catalog.findVersion(toolId, found.version.version)) {
          // Copied already: an update is waiting only if production does not serve it yet.
          const production = (await catalog.listEnvironments(toolId)).find(
            (e) => e.name === "production",
          );
          const served = production?.versionId
            ? await catalog.getVersion(production.versionId)
            : undefined;
          return served?.version === found.version.version
            ? undefined
            : { version: found.version.version };
        }
        return { version: found.version.version };
      }
      const environments = await catalog.listEnvironments(toolId);
      const preview = environments.find(
        (e) => e.name === "preview" && e.branch === source.productionBranch && e.versionId,
      );
      if (!preview?.versionId) return undefined;
      const production = environments.find((e) => e.name === "production");
      if (production?.versionId === preview.versionId) return undefined;
      const candidate = await catalog.getVersion(preview.versionId);
      return candidate
        ? { version: candidate.version, branch: source.productionBranch }
        : undefined;
    },

    /**
     * Copies the catalogue's latest version into a marketplace tool, with what it asks for that
     * production does not have as pending approvals, in one batch with the audit line. Nothing is
     * deployed: the update promotes it. A version already copied is answered as it is.
     */
    async updateFromSource(input: {
      toolId: string;
      actor: string;
      via?: string;
    }): Promise<{ version: string; approvals: Array<{ resource: string; kind: string }> }> {
      const source = await this.toolSource(input.toolId);
      if (source.kind !== "marketplace" || !source.source || !source.sourceTool) {
        throw new RegistryError("INVALID", "This tool is not installed from a marketplace.");
      }
      const from = await catalog.findTool(source.source, source.sourceTool);
      const found = from ? await latest(from.id) : undefined;
      if (!from || !found) {
        throw new RegistryError("NOT_FOUND", `The marketplace no longer has ${source.sourceTool}.`);
      }
      if (found.build.worker === undefined) {
        throw new RegistryError("NO_ARTIFACT", "The new version was recorded without its code.");
      }
      const existing = await catalog.findVersion(input.toolId, found.version.version);
      if (existing) return { version: existing.version, approvals: [] };
      const manifest = found.build.manifest as Manifest;
      const baseline = (await productionManifest(input.toolId))?.resources ?? {};
      const requests = diffResourceChanges(baseline, manifest.resources ?? {})
        .filter((c) => c.needsApproval)
        .map((c) => ({ resource: c.subject, kind: c.kind }));
      const at = now();
      const copy = copyVersion({
        toolId: input.toolId,
        fromToolId: from.id,
        fromBuildId: found.build.id,
        version: found.version.version,
        requests,
        at,
      });
      await d1.batch([
        ...copy.statements,
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.actor,
            ...(input.via ? { via: input.via } : {}),
            kind: "install",
            subject: `${source.sourceTool}:${found.version.version}`,
            versionId: copy.versionId,
            detail: { event: "update", source: source.source },
          },
          at,
        ),
      ]);
      return { version: found.version.version, approvals: requests };
    },

    // ---- install plans (D-092): the admin MCP shows a plan, then installs only that plan
    /**
     * Shows what installing a template would create, and records the plan: an identifier bound to
     * the person and the workspace, naming the version it showed, valid for 15 minutes. Creates no
     * tool. The audit line says that a plan was made, not what it will install.
     */
    async createInstallPlan(input: {
      workspace: string;
      template: string;
      person: string;
      via?: string;
      source?: string;
    }): Promise<InstallPlan> {
      const from = sourceOf(input.source);
      if (isSource(input.workspace)) {
        throw new RegistryError("INVALID", "A catalogue is not a workspace.");
      }
      const source = await catalog.findTool(from, input.template);
      const found = source ? await latest(source.id) : undefined;
      if (!source || !found) {
        throw new RegistryError("NOT_FOUND", `There is no template ${input.template}.`);
      }
      if (await catalog.findTool(input.workspace, input.template)) {
        throw new RegistryError(
          "ALREADY_EXISTS",
          `The workspace ${input.workspace} already has a tool ${input.template}.`,
        );
      }
      const manifest = found.build.manifest as Manifest;
      const at = now();
      const id = newId();
      const expiresAt = new Date(Date.parse(at) + INSTALL_PLAN_TTL_MS).toISOString();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "install_plans" ("id", "workspace", "template", "version", "person", "created_at", "expires_at", "source") VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            id,
            input.workspace,
            input.template,
            found.version.version,
            input.person,
            at,
            expiresAt,
            from,
          ),
        auditStatement(
          {
            actor: input.person,
            ...(input.via ? { via: input.via } : {}),
            kind: "access",
            subject: `install-plan:${input.template}`,
            detail: {
              event: "install-planned",
              workspace: input.workspace,
              version: found.version.version,
              ...(from === TEMPLATE_WORKSPACE ? {} : { source: from }),
            },
          },
          at,
        ),
      ]);
      return {
        id,
        template: input.template,
        version: found.version.version,
        resources: diffResourceChanges({}, manifest.resources ?? {}).map((c) => c.subject),
        expiresAt,
      };
    },

    /**
     * Installs the template a plan showed, once. A plan that is unknown, another person's, another
     * workspace's, spent or expired is refused, and so is one whose template has a newer version
     * than the one the admin read ("stale": ask for a new plan). The plan is spent by a conditional
     * update before anything is created, so two parallel uses cannot both install.
     */
    async installFromPlan(input: {
      workspace: string;
      plan: string;
      person: string;
      via?: string;
    }): Promise<InstalledTemplate | InstallPlanRefusal> {
      const row = await first(
        `SELECT "template", "version", "person", "expires_at", "used_at", "source" FROM "install_plans" WHERE "id" = ? AND "workspace" = ?`,
        input.plan,
        input.workspace,
      );
      // Another person's plan, or another workspace's, is the same answer as no plan.
      if (!row || String(row.person) !== input.person) return "unknown";
      if (row.used_at !== null && row.used_at !== undefined) return "used";
      const at = now();
      if (String(row.expires_at) <= at) return "expired";
      const template = String(row.template);
      const from = String(row.source);
      const source = await catalog.findTool(from, template);
      const current = source ? await latest(source.id) : undefined;
      if (current?.version.version !== String(row.version)) return "stale";
      const claim = newId();
      await d1.batch([
        d1
          .prepare(
            `UPDATE "install_plans" SET "used_at" = ?, "claim" = ? WHERE "id" = ? AND "person" = ? AND "used_at" IS NULL AND "expires_at" > ?`,
          )
          .bind(at, claim, input.plan, input.person, at),
      ]);
      const won = await first(
        `SELECT 1 FROM "install_plans" WHERE "id" = ? AND "claim" = ?`,
        input.plan,
        claim,
      );
      if (!won) return "used";
      // A plan spent and then refused here (the workspace gained a tool of that name meanwhile) is
      // not given back: a new plan is cheap, and a retry cannot install twice.
      return this.installTemplate({
        workspace: input.workspace,
        template,
        actor: input.person,
        ...(input.via ? { via: input.via } : {}),
        source: from,
      });
    },
  };
}
