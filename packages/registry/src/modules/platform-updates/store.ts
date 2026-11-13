// The record of the platform updating itself (D-138): one row per attempt, written step by step so
// that the console can poll it and a failure can say what was done. The module never reaches GitHub
// or Cloudflare: the gateway runs the update and tells this store what happened.
import { RegistryError } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import { UPDATE_STEPS, toUpdateRun, type UpdateRun, type UpdateStep } from "./types";

export function createPlatformUpdates(kernel: Kernel) {
  const { d1, now, newId, all, first, auditStatement } = kernel;

  const get = async (id: string): Promise<UpdateRun | undefined> => {
    const row = await first(`SELECT * FROM "platform_updates" WHERE "id" = ?`, id);
    return row ? toUpdateRun(row) : undefined;
  };

  return {
    /**
     * Starts a run, every step pending. One at a time: while another run is `running` this throws
     * `ALREADY_EXISTS` (the database refuses a second one, so two requests cannot both start).
     */
    async startUpdateRun(input: {
      fromVersion: string;
      toVersion: string;
      actor: string;
    }): Promise<UpdateRun> {
      const run: UpdateRun = {
        id: newId(),
        fromVersion: input.fromVersion,
        toVersion: input.toVersion,
        state: "running",
        steps: UPDATE_STEPS.map((name) => ({ name, state: "pending" })),
        actor: input.actor,
        startedAt: now(),
      };
      try {
        await d1.batch([
          d1
            .prepare(
              `INSERT INTO "platform_updates" ("id", "from_version", "to_version", "state", "steps", "actor", "started_at") VALUES (?, ?, ?, 'running', ?, ?, ?)`,
            )
            .bind(
              run.id,
              run.fromVersion,
              run.toVersion,
              JSON.stringify(run.steps),
              run.actor,
              run.startedAt,
            ),
        ]);
      } catch (error) {
        if (await this.findRunningUpdate()) {
          throw new RegistryError("ALREADY_EXISTS", "An update is already running.");
        }
        throw error;
      }
      return run;
    },

    /** Records the steps as they are now, and the restore point once it is taken. */
    async saveUpdateSteps(
      id: string,
      steps: readonly UpdateStep[],
      bookmark?: string,
    ): Promise<void> {
      await d1.batch([
        d1
          .prepare(
            `UPDATE "platform_updates" SET "steps" = ?, "bookmark" = COALESCE(?, "bookmark") WHERE "id" = ? AND "state" = 'running'`,
          )
          .bind(JSON.stringify(steps), bookmark ?? null, id),
      ]);
    },

    /**
     * Ends a run and writes its audit line in the same batch: from, to, the restore point and the
     * result. The line has no tool (the platform is not a tool's), as the member changes have none.
     */
    async finishUpdateRun(
      id: string,
      end: { result: "succeeded" | "failed"; steps: readonly UpdateStep[]; error?: string },
    ): Promise<UpdateRun> {
      const run = await get(id);
      if (!run) throw new RegistryError("NOT_FOUND", `There is no update run ${id}.`);
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `UPDATE "platform_updates" SET "state" = ?, "steps" = ?, "finished_at" = ?, "error" = ? WHERE "id" = ?`,
          )
          .bind(end.result, JSON.stringify(end.steps), at, end.error ?? null, id),
        auditStatement(
          {
            actor: run.actor,
            interface: "api",
            kind: "access",
            subject: "platform:update",
            result: end.result === "succeeded" ? "ok" : "error",
            detail: {
              run: id,
              from: run.fromVersion,
              to: run.toVersion,
              bookmark: run.bookmark ?? null,
              result: end.result,
              ...(end.error ? { error: end.error } : {}),
            },
          },
          at,
        ),
      ]);
      return (await get(id))!;
    },

    /**
     * Ends the runs that started before `before` and never finished: the gateway stopped under them
     * (a Worker that finishes its work after the answer is cut short after 30 seconds). Without this
     * a dead run would block every later update. Returns how many it ended.
     */
    async interruptStaleUpdates(before: string): Promise<number> {
      const stale = await all(
        `SELECT * FROM "platform_updates" WHERE "state" = 'running' AND "started_at" < ?`,
        before,
      );
      for (const row of stale) {
        const run = toUpdateRun(row);
        await this.finishUpdateRun(run.id, {
          result: "failed",
          steps: run.steps.map((s) =>
            s.state === "running"
              ? { ...s, state: "failed", message: "The gateway stopped before this step ended." }
              : s,
          ),
          error: "The update was interrupted: the gateway stopped before it finished.",
        });
      }
      return stale.length;
    },

    async findRunningUpdate(): Promise<UpdateRun | undefined> {
      const row = await first(`SELECT * FROM "platform_updates" WHERE "state" = 'running'`);
      return row ? toUpdateRun(row) : undefined;
    },

    getUpdateRun: get,

    /** The latest runs, newest first. */
    async listUpdateRuns(limit = 20): Promise<UpdateRun[]> {
      const rows = await all(
        `SELECT * FROM "platform_updates" ORDER BY "started_at" DESC, "rowid" DESC LIMIT ?`,
        limit,
      );
      return rows.map(toUpdateRun);
    },
  };
}
