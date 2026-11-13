import type { AuditKind } from "../../kernel/audit";
import type { RegisteredEnvironment } from "../../kernel/errors";
import { RegistryError } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import { text } from "../../kernel/rows";
import type { BuildDocs } from "@forgeron/hosting";
import { toTool, toBuild, toVersion, toEnvironment, toDeployment } from "./types";
import type {
  Tool,
  BuildRecord,
  VersionRecord,
  EnvironmentRecord,
  DeploymentKind,
  DeploymentCommit,
  DeploymentRecord,
  DocFile,
} from "./types";

// The README and the images of a version are chunked like the gateway's code (D-056).
const DOC_CHUNK = 20_000;
const DOC_BATCH = 100;
/** The README and the guide are stored among the files of a build under these paths, with this type. */
const README_PATH = "README.md";
const GUIDE_PATH = "GUIDE.md";
const MARKDOWN_TYPE = "text/markdown";
const isMarkdown = (path: string) => path === README_PATH || path === GUIDE_PATH;

const DEPLOYMENT_AUDIT: Record<DeploymentKind, AuditKind> = {
  deploy: "deployment",
  promote: "promotion",
  rollback: "rollback",
};

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Names a permanent channel may not take: the environments' own words. */
const RESERVED_CHANNELS = new Set(["production", "preview", "local", "channel"]);

/**
 * What is wrong with a permanent channel's name, or `undefined` (D-125): lowercase letters, digits and
 * `-`, starting with a letter, 30 characters at most, not one of the environments' own words.
 */
export function channelNameProblem(name: string): string | undefined {
  if (!/^[a-z][a-z0-9-]{0,29}$/.test(name)) {
    return "A channel's name: lowercase letters, digits and '-', starting with a letter, 30 at most.";
  }
  if (RESERVED_CHANNELS.has(name)) return `${name} is not a name a channel can take.`;
  return undefined;
}

/** The columns of a build, and the ones a reader may leave out of the read. */
const BUILD_COLUMNS = [
  "id",
  "tool_id",
  "fingerprint",
  "manifest",
  "changelog",
  "worker",
  "migrations",
  "views",
  "created_at",
] as const;
export type BuildColumn = "changelog" | "worker" | "migrations" | "views";
const buildColumns = (omit: readonly BuildColumn[] = []) =>
  BUILD_COLUMNS.filter((c) => !(omit as readonly string[]).includes(c))
    .map((c) => `"${c}"`)
    .join(", ");

export function createCatalog(kernel: Kernel) {
  const { d1, now, newId, all, first, write, auditStatement } = kernel;
  /** The content stored under a hash, whole. */
  const docBlob = async (toolId: string, hash: string): Promise<string | undefined> => {
    const rows = await all(
      `SELECT "content" FROM "docs_blobs" WHERE "tool_id" = ? AND "hash" = ? ORDER BY "part"`,
      toolId,
      hash,
    );
    return rows.length ? rows.map((r) => String(r.content)).join("") : undefined;
  };

  async function requireTool(id: string): Promise<Tool> {
    const row = await first(`SELECT * FROM "tools" WHERE "id" = ?`, id);
    if (!row) throw new RegistryError("NOT_FOUND", `There is no tool ${id}.`);
    return toTool(row);
  }

  const api = {
    // ---- tools
    async createTool(input: { workspace: string; name: string }): Promise<Tool> {
      if (await this.findTool(input.workspace, input.name)) {
        throw new RegistryError(
          "ALREADY_EXISTS",
          `The workspace ${input.workspace} already has a tool ${input.name}.`,
        );
      }
      const id = newId();
      await write(
        `INSERT INTO "tools" ("id", "workspace", "name", "created_at") VALUES (?, ?, ?, ?)`,
        id,
        input.workspace,
        input.name,
        now(),
      );
      return requireTool(id);
    },
    async findTool(workspace: string, name: string): Promise<Tool | undefined> {
      const row = await first(
        `SELECT * FROM "tools" WHERE "workspace" = ? AND "name" = ?`,
        workspace,
        name,
      );
      return row ? toTool(row) : undefined;
    },
    async listTools(workspace: string): Promise<Tool[]> {
      return (
        await all(`SELECT * FROM "tools" WHERE "workspace" = ? ORDER BY "name"`, workspace)
      ).map(toTool);
    },
    /** Deletes the tool with its builds, versions, environments and approvals. */
    async deleteTool(id: string): Promise<void> {
      await requireTool(id);
      await write(`DELETE FROM "tools" WHERE "id" = ?`, id);
    },

    // ---- builds
    /** Records what CI sent. The same fingerprint gives back the build already recorded. */
    async recordBuild(
      toolId: string,
      input: {
        fingerprint: string;
        manifest: unknown;
        changelog?: unknown;
        worker?: string;
        migrations?: unknown;
        views?: Record<string, string>;
      },
    ): Promise<BuildRecord> {
      await requireTool(toolId);
      const existing = await first(
        `SELECT * FROM "builds" WHERE "tool_id" = ? AND "fingerprint" = ?`,
        toolId,
        input.fingerprint,
      );
      if (existing) return toBuild(existing);
      const id = newId();
      await write(
        `INSERT INTO "builds" ("id", "tool_id", "fingerprint", "manifest", "changelog", "worker", "migrations", "views", "created_at") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        toolId,
        input.fingerprint,
        JSON.stringify(input.manifest),
        input.changelog === undefined ? null : JSON.stringify(input.changelog),
        input.worker ?? null,
        input.migrations === undefined ? null : JSON.stringify(input.migrations),
        input.views === undefined ? null : JSON.stringify(input.views),
        now(),
      );
      return toBuild((await first(`SELECT * FROM "builds" WHERE "id" = ?`, id))!);
    },
    /**
     * Stores the README and the images of a build (D-056). The content goes first, once per hash and
     * in batches; the list of the build's files goes last, so a build with a list has all its content.
     * The same build stored twice is the same.
     */
    async storeDocs(toolId: string, buildId: string, docs: BuildDocs): Promise<void> {
      const files: Array<{ path: string; type: string; size: number; hash: string; text: string }> =
        [];
      for (const [path, text] of [
        [README_PATH, docs.readme],
        [GUIDE_PATH, docs.guide],
      ] as const) {
        if (text === undefined) continue;
        const bytes = new TextEncoder().encode(text);
        files.push({
          path,
          type: MARKDOWN_TYPE,
          size: bytes.length,
          hash: await sha256Hex(bytes),
          text,
        });
      }
      for (const a of docs.assets) {
        files.push({ path: a.path, type: a.type, size: a.size, hash: a.hash, text: a.base64 });
      }
      const known = new Set(
        (await all(`SELECT DISTINCT "hash" FROM "docs_blobs" WHERE "tool_id" = ?`, toolId)).map(
          (r) => String(r.hash),
        ),
      );
      const insert = d1.prepare(
        `INSERT OR IGNORE INTO "docs_blobs" ("tool_id", "hash", "part", "content") VALUES (?, ?, ?, ?)`,
      );
      const statements = [];
      for (const file of files) {
        if (known.has(file.hash)) continue;
        known.add(file.hash);
        // An empty file still gets one row.
        const parts = Math.max(1, Math.ceil(file.text.length / DOC_CHUNK));
        for (let part = 0; part < parts; part++) {
          statements.push(
            insert.bind(
              toolId,
              file.hash,
              part,
              file.text.slice(part * DOC_CHUNK, (part + 1) * DOC_CHUNK),
            ),
          );
        }
      }
      for (let i = 0; i < statements.length; i += DOC_BATCH) {
        await d1.batch(statements.slice(i, i + DOC_BATCH));
      }
      const list = d1.prepare(
        `INSERT OR REPLACE INTO "build_docs" ("build_id", "path", "hash", "type", "size") VALUES (?, ?, ?, ?, ?)`,
      );
      await d1.batch([
        d1.prepare(`DELETE FROM "build_docs" WHERE "build_id" = ?`).bind(buildId),
        ...files.map((f) => list.bind(buildId, f.path, f.hash, f.type, f.size)),
      ]);
    },
    /** The files of a build's documentation, without their content. */
    async docsOf(buildId: string): Promise<DocFile[]> {
      return (
        await all(
          `SELECT "path", "hash", "type", "size" FROM "build_docs" WHERE "build_id" = ? ORDER BY "path"`,
          buildId,
        )
      ).map((r) => ({
        path: String(r.path),
        hash: String(r.hash),
        type: String(r.type),
        size: Number(r.size),
      }));
    },
    /** The README of a build, or `undefined` if it has none. */
    async readmeOf(toolId: string, buildId: string): Promise<string | undefined> {
      const file = (await this.docsOf(buildId)).find((f) => f.path === README_PATH);
      if (!file) return undefined;
      return (await docBlob(toolId, file.hash)) ?? undefined;
    },
    /** The guide (`GUIDE.md`, D-115) of a build, or `undefined` if it has none. */
    async guideOf(toolId: string, buildId: string): Promise<string | undefined> {
      const file = (await this.docsOf(buildId)).find((f) => f.path === GUIDE_PATH);
      if (!file) return undefined;
      return (await docBlob(toolId, file.hash)) ?? undefined;
    },
    /** One image of a build, as bytes; `undefined` if the build has no such file (README and guide are not). */
    async assetOf(
      toolId: string,
      buildId: string,
      path: string,
    ): Promise<(DocFile & { bytes: Uint8Array }) | undefined> {
      const file = (await this.docsOf(buildId)).find((f) => f.path === path && !isMarkdown(f.path));
      if (!file) return undefined;
      const base64 = await docBlob(toolId, file.hash);
      if (base64 === undefined) return undefined;
      return { ...file, bytes: Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)) };
    },
    /**
     * A build. The Worker's code, the migrations and the views are large and most readers want the
     * manifest only: `omit` leaves a column out of the read, so it is not carried from the database
     * (`worker` alone is hundreds of kilobytes). Without `omit` the whole row is read.
     */
    async getBuild(
      id: string,
      options: { omit?: readonly BuildColumn[] } = {},
    ): Promise<BuildRecord | undefined> {
      const row = await first(
        `SELECT ${buildColumns(options.omit)} FROM "builds" WHERE "id" = ?`,
        id,
      );
      return row ? toBuild(row) : undefined;
    },
    /**
     * The build an environment serves, in one read instead of three (environment, version, build):
     * production, a permanent channel (`channel`) or a branch's temporary channel (`branch`).
     * `undefined` when nothing is deployed there.
     */
    async servedBuild(
      toolId: string,
      served: { production: true } | { channel: string } | { branch: string },
      options: { omit?: readonly BuildColumn[] } = {},
    ): Promise<BuildRecord | undefined> {
      const where =
        "production" in served
          ? [`e."name" = 'production'`]
          : "channel" in served
            ? [`e."name" = 'channel' AND e."channel" = ?`, served.channel]
            : [`e."name" = 'preview' AND e."branch" = ?`, served.branch];
      const columns = buildColumns(options.omit)
        .split(", ")
        .map((c) => `b.${c}`)
        .join(", ");
      const row = await first(
        `SELECT ${columns} FROM "environments" e JOIN "versions" v ON v."id" = e."version_id" JOIN "builds" b ON b."id" = v."build_id" WHERE e."tool_id" = ? AND ${where[0]} LIMIT 1`,
        toolId,
        ...where.slice(1),
      );
      return row ? toBuild(row) : undefined;
    },

    // ---- versions
    /**
     * Publishes a build under a version number. A version number is used once per tool. `branch` is
     * the branch whose push made it (D-125): a permanent channel finds its branch's releases by it.
     */
    async publishVersion(
      toolId: string,
      buildId: string,
      version: string,
      branch?: string,
    ): Promise<VersionRecord> {
      const build = await this.getBuild(buildId);
      if (!build) throw new RegistryError("NOT_FOUND", `There is no build ${buildId}.`);
      if (build.toolId !== toolId) {
        throw new RegistryError("WRONG_TOOL", `The build ${buildId} belongs to another tool.`);
      }
      if (
        await first(
          `SELECT 1 FROM "versions" WHERE "tool_id" = ? AND "version" = ?`,
          toolId,
          version,
        )
      ) {
        throw new RegistryError("ALREADY_EXISTS", `The tool already has a version ${version}.`);
      }
      const id = newId();
      await write(
        `INSERT INTO "versions" ("id", "tool_id", "build_id", "version", "branch", "created_at") VALUES (?, ?, ?, ?, ?, ?)`,
        id,
        toolId,
        buildId,
        version,
        branch ?? null,
        now(),
      );
      return toVersion((await first(`SELECT * FROM "versions" WHERE "id" = ?`, id))!);
    },
    async getVersion(id: string): Promise<VersionRecord | undefined> {
      const row = await first(`SELECT * FROM "versions" WHERE "id" = ?`, id);
      return row ? toVersion(row) : undefined;
    },
    /**
     * The versions a branch's pushes made, newest first, with their build's changelog: a permanent
     * channel looks among them for its next release (D-125).
     */
    async versionsOfBranch(
      toolId: string,
      branch: string,
      limit = 100,
    ): Promise<Array<VersionRecord & { changelog: unknown; manifest: unknown }>> {
      return (
        await all(
          `SELECT v.*, b."changelog" AS "build_changelog", b."manifest" AS "build_manifest" FROM "versions" v JOIN "builds" b ON b."id" = v."build_id" WHERE v."tool_id" = ? AND v."branch" = ? ORDER BY v."created_at" DESC, v."rowid" DESC LIMIT ?`,
          toolId,
          branch,
          limit,
        )
      ).map((r) => ({
        ...toVersion(r),
        changelog: r.build_changelog ? JSON.parse(String(r.build_changelog)) : null,
        manifest: r.build_manifest ? JSON.parse(String(r.build_manifest)) : null,
      }));
    },
    /** Oldest first, in the order they were published. */
    async listVersions(toolId: string): Promise<VersionRecord[]> {
      return (
        await all(
          `SELECT * FROM "versions" WHERE "tool_id" = ? ORDER BY "created_at", "rowid"`,
          toolId,
        )
      ).map(toVersion);
    },

    // ---- environments: the channels of a tool (D-125)
    /**
     * The environment of a tool. Production and a branch's preview are created if needed; a permanent
     * channel other than production (`key` is its name) only exists once an admin added it
     * (`addChannel`).
     */
    async ensureEnvironment(
      toolId: string,
      name: RegisteredEnvironment,
      key?: string,
    ): Promise<EnvironmentRecord> {
      await requireTool(toolId);
      if (name === "preview" && !key) {
        throw new RegistryError("BRANCH_REQUIRED", "A preview environment is tied to a branch.");
      }
      if (name === "channel") {
        const channel = await this.findChannel(toolId, key ?? "");
        if (!channel) throw new RegistryError("NOT_FOUND", `There is no channel ${key ?? ""}.`);
        return channel;
      }
      const branch = name === "preview" ? key! : "";
      const found = await first(
        `SELECT * FROM "environments" WHERE "tool_id" = ? AND "name" = ? AND "branch" = ? AND "channel" = ''`,
        toolId,
        name,
        branch,
      );
      if (found) return toEnvironment(found);
      const id = newId();
      await write(
        `INSERT INTO "environments" ("id", "tool_id", "name", "branch", "created_at") VALUES (?, ?, ?, ?, ?)`,
        id,
        toolId,
        name,
        branch,
        now(),
      );
      return toEnvironment((await first(`SELECT * FROM "environments" WHERE "id" = ?`, id))!);
    },
    async listEnvironments(toolId: string): Promise<EnvironmentRecord[]> {
      return (
        await all(
          `SELECT * FROM "environments" WHERE "tool_id" = ? ORDER BY "name", "branch", "channel"`,
          toolId,
        )
      ).map(toEnvironment);
    },
    /**
     * The environments of a tool known by its workspace and name, so that the tool and its environments
     * can be read together: one trip for both instead of the tool first (D-143).
     */
    async environmentsOfTool(workspace: string, name: string): Promise<EnvironmentRecord[]> {
      return (
        await all(
          `SELECT e.* FROM "environments" e JOIN "tools" t ON t."id" = e."tool_id" WHERE t."workspace" = ? AND t."name" = ? ORDER BY e."name", e."branch", e."channel"`,
          workspace,
          name,
        )
      ).map(toEnvironment);
    },
    /** A permanent channel other than production, by its name. */
    async findChannel(toolId: string, name: string): Promise<EnvironmentRecord | undefined> {
      const row = await first(
        `SELECT * FROM "environments" WHERE "tool_id" = ? AND "name" = 'channel' AND "channel" = ?`,
        toolId,
        name,
      );
      return row ? toEnvironment(row) : undefined;
    },
    /**
     * Adds a permanent channel (D-125): its own Worker and database once a release reaches it. It
     * follows a branch (a repository tool) or the marketplace (none). Audited.
     */
    async addChannel(input: {
      toolId: string;
      name: string;
      follows?: string;
      autoUpdate?: boolean;
      actor: string;
      via?: string;
    }): Promise<EnvironmentRecord> {
      await requireTool(input.toolId);
      const problem = channelNameProblem(input.name);
      if (problem) throw new RegistryError("INVALID", problem);
      if (await this.findChannel(input.toolId, input.name)) {
        throw new RegistryError("ALREADY_EXISTS", `The tool already has a channel ${input.name}.`);
      }
      const id = newId();
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "environments" ("id", "tool_id", "name", "branch", "channel", "follows", "auto_update", "created_at") VALUES (?, ?, 'channel', '', ?, ?, ?, ?)`,
          )
          .bind(id, input.toolId, input.name, input.follows ?? null, input.autoUpdate ? 1 : 0, at),
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.actor,
            ...(input.via ? { via: input.via } : {}),
            kind: "access",
            subject: `channel:${input.name}`,
            detail: {
              event: "channel-added",
              ...(input.follows ? { follows: input.follows } : {}),
              autoUpdate: input.autoUpdate === true,
            },
          },
          at,
        ),
      ]);
      return toEnvironment((await first(`SELECT * FROM "environments" WHERE "id" = ?`, id))!);
    },
    /** Changes the branch a permanent channel follows, or whether it updates by itself. Audited. */
    async setChannel(input: {
      toolId: string;
      name: string;
      follows?: string;
      autoUpdate?: boolean;
      actor: string;
      via?: string;
    }): Promise<EnvironmentRecord> {
      const current = await this.findChannel(input.toolId, input.name);
      if (!current) throw new RegistryError("NOT_FOUND", `There is no channel ${input.name}.`);
      const follows = input.follows ?? current.follows;
      const autoUpdate = input.autoUpdate ?? current.autoUpdate === true;
      const at = now();
      await d1.batch([
        d1
          .prepare(`UPDATE "environments" SET "follows" = ?, "auto_update" = ? WHERE "id" = ?`)
          .bind(follows ?? null, autoUpdate ? 1 : 0, current.id),
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.actor,
            ...(input.via ? { via: input.via } : {}),
            kind: "access",
            subject: `channel:${input.name}`,
            detail: {
              event: "channel-settings",
              ...(follows ? { follows } : {}),
              autoUpdate,
            },
          },
          at,
        ),
      ]);
      return (await this.findChannel(input.toolId, input.name))!;
    },
    /**
     * Records that the environment serves this version, and writes the line of the audit log, in
     * one batch (the traffic switch itself is `hosting`'s).
     */
    async activate(
      environmentId: string,
      versionId: string,
      options: {
        actor: string;
        via?: string;
        kind?: DeploymentKind;
        url?: string;
        commit?: DeploymentCommit;
        /** Why a person updated or rolled back: written in the audit line. */
        reason?: string;
      },
    ): Promise<EnvironmentRecord> {
      const env = await first(`SELECT * FROM "environments" WHERE "id" = ?`, environmentId);
      if (!env) throw new RegistryError("NOT_FOUND", `There is no environment ${environmentId}.`);
      const version = await this.getVersion(versionId);
      if (!version) throw new RegistryError("NOT_FOUND", `There is no version ${versionId}.`);
      if (version.toolId !== String(env.tool_id)) {
        throw new RegistryError("WRONG_TOOL", "The version belongs to another tool.");
      }
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `UPDATE "environments" SET "version_id" = ?, "url" = ?, "activated_at" = ? WHERE "id" = ?`,
          )
          .bind(versionId, options.url ?? null, at, environmentId),
        d1
          .prepare(
            `INSERT INTO "deployments" ("id", "tool_id", "environment_id", "version_id", "kind", "actor", "commit_sha", "commit_message", "commit_author", "created_at") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            newId(),
            version.toolId,
            environmentId,
            versionId,
            options.kind ?? "deploy",
            options.actor,
            options.commit?.sha ?? null,
            options.commit?.message ?? null,
            options.commit?.author ?? null,
            at,
          ),
        auditStatement(
          {
            toolId: version.toolId,
            actor: options.actor,
            ...(options.via ? { via: options.via } : {}),
            kind: DEPLOYMENT_AUDIT[options.kind ?? "deploy"],
            subject: `${env.channel ? `channel:${String(env.channel)}` : String(env.name)}:${version.version}`,
            versionId,
            detail: {
              environment: String(env.name),
              ...(env.branch ? { branch: String(env.branch) } : {}),
              ...(env.channel ? { channel: String(env.channel) } : {}),
              ...(options.reason ? { reason: options.reason } : {}),
            },
          },
          at,
        ),
      ]);
      return toEnvironment(
        (await first(`SELECT * FROM "environments" WHERE "id" = ?`, environmentId))!,
      );
    },
    /** The audit log of an environment, oldest first. */
    async history(environmentId: string): Promise<DeploymentRecord[]> {
      return (
        await all(
          `SELECT * FROM "deployments" WHERE "environment_id" = ? ORDER BY "rowid"`,
          environmentId,
        )
      ).map(toDeployment);
    },
    /** Every deployment of a tool, newest first: the history the console shows. */
    async listDeployments(toolId: string, limit = 200): Promise<DeploymentRecord[]> {
      return (
        await all(
          `SELECT * FROM "deployments" WHERE "tool_id" = ? ORDER BY "rowid" DESC LIMIT ?`,
          toolId,
          limit,
        )
      ).map(toDeployment);
    },
    /** The version the environment served before the current one: the latest one that is not it. */
    async previousVersion(environmentId: string): Promise<VersionRecord | undefined> {
      const env = await first(`SELECT * FROM "environments" WHERE "id" = ?`, environmentId);
      if (!env) throw new RegistryError("NOT_FOUND", `There is no environment ${environmentId}.`);
      const row = await first(
        `SELECT "version_id" FROM "deployments" WHERE "environment_id" = ? AND "version_id" != ? ORDER BY "rowid" DESC LIMIT 1`,
        environmentId,
        text(env.version_id) ?? "",
      );
      return row ? this.getVersion(String(row.version_id)) : undefined;
    },
    async findVersion(toolId: string, version: string): Promise<VersionRecord | undefined> {
      const row = await first(
        `SELECT * FROM "versions" WHERE "tool_id" = ? AND "version" = ?`,
        toolId,
        version,
      );
      return row ? toVersion(row) : undefined;
    },
    /** Forgets an environment (a preview whose branch is gone, a channel an admin removed). */
    async removeEnvironment(environmentId: string): Promise<void> {
      await write(`DELETE FROM "environments" WHERE "id" = ?`, environmentId);
    },
  };

  return { api, requireTool };
}

export type Catalog = ReturnType<typeof createCatalog>;
