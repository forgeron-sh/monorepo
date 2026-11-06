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
import { TEMPLATE_WORKSPACE, type InstalledTemplate, type Template } from "./types";

/** What this module asks of the catalog: narrow, and only through its public API. */
export type CatalogPort = Pick<
  Catalog["api"],
  "findTool" | "listTools" | "listVersions" | "getBuild"
>;

export function createTemplates(kernel: Kernel, catalog: CatalogPort) {
  const { d1, now, newId, auditStatement } = kernel;

  /** The latest version of a template and the manifest of its build, if it has one. */
  async function latest(toolId: string) {
    const version = (await catalog.listVersions(toolId)).at(-1);
    const build = version ? await catalog.getBuild(version.buildId) : undefined;
    return version && build ? { version, build } : undefined;
  }

  return {
    // ---- template catalogue
    /** The templates of the catalogue, by name. A tool of the catalogue with no version is not one yet. */
    async listTemplates(): Promise<Template[]> {
      const templates: Template[] = [];
      for (const tool of await catalog.listTools(TEMPLATE_WORKSPACE)) {
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
    }): Promise<InstalledTemplate> {
      if (input.workspace === TEMPLATE_WORKSPACE) {
        throw new RegistryError("INVALID", "The template catalogue is not a workspace.");
      }
      const source = await catalog.findTool(TEMPLATE_WORKSPACE, input.template);
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
        auditStatement(
          {
            toolId,
            actor: input.actor,
            ...(input.via ? { via: input.via } : {}),
            kind: "install",
            subject: `${input.template}:${found.version.version}`,
            versionId,
            detail: { template: input.template, workspace: input.workspace },
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
  };
}
