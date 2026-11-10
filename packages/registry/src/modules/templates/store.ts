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
  type DescribedTemplate,
  type InstalledTemplate,
  type InstallPlan,
  type InstallPlanRefusal,
  type Template,
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
  "findTool" | "listTools" | "listVersions" | "getBuild" | "readmeOf" | "guideOf"
>;

export function createTemplates(kernel: Kernel, catalog: CatalogPort) {
  const { d1, now, newId, first, auditStatement } = kernel;

  /** The latest version of a template and the manifest of its build, if it has one. */
  async function latest(toolId: string) {
    const version = (await catalog.listVersions(toolId)).at(-1);
    const build = version ? await catalog.getBuild(version.buildId) : undefined;
    return version && build ? { version, build } : undefined;
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
      const buildId = newId();
      const versionId = newId();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "tools" ("id", "workspace", "name", "created_at") VALUES (?, ?, ?, ?)`,
          )
          .bind(toolId, input.workspace, input.template, at),
        d1
          .prepare(
            `INSERT INTO "builds" ("id", "tool_id", "fingerprint", "manifest", "changelog", "worker", "migrations", "created_at") SELECT ?, ?, "fingerprint", "manifest", "changelog", "worker", "migrations", ? FROM "builds" WHERE "id" = ?`,
          )
          .bind(buildId, toolId, at, found.build.id),
        // The content is keyed by tool and hash: copied by the database, never read here.
        d1
          .prepare(
            `INSERT OR IGNORE INTO "docs_blobs" ("tool_id", "hash", "part", "content") SELECT ?, "hash", "part", "content" FROM "docs_blobs" WHERE "tool_id" = ?`,
          )
          .bind(toolId, source.id),
        d1
          .prepare(
            `INSERT INTO "build_docs" ("build_id", "path", "hash", "type", "size") SELECT ?, "path", "hash", "type", "size" FROM "build_docs" WHERE "build_id" = ?`,
          )
          .bind(buildId, found.build.id),
        d1
          .prepare(
            `INSERT INTO "versions" ("id", "tool_id", "build_id", "version", "created_at") VALUES (?, ?, ?, ?, ?)`,
          )
          .bind(versionId, toolId, buildId, found.version.version, at),
        ...requests.map((r) =>
          d1
            .prepare(
              `INSERT INTO "approvals" ("id", "tool_id", "version_id", "resource", "kind", "requested_at") VALUES (?, ?, ?, ?, ?, ?)`,
            )
            .bind(newId(), toolId, versionId, r.resource, r.kind, at),
        ),
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
