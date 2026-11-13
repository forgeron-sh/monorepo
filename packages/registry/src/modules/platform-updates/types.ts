import type { Row } from "../../kernel/rows";

/** What an update does, in this order (D-138). */
export const UPDATE_STEPS = ["download", "restore-point", "migrate", "code", "deploy"] as const;
export type UpdateStepName = (typeof UPDATE_STEPS)[number];

export type UpdateStepState = "pending" | "running" | "done" | "failed";

export interface UpdateStep {
  name: UpdateStepName;
  state: UpdateStepState;
  /** What the step did, or why it failed: fit to show a person. */
  message?: string;
}

export type UpdateRunState = "running" | "succeeded" | "failed";

/** One attempt to update the platform (D-138). The platform is shared by its workspaces: no workspace here. */
export interface UpdateRun {
  id: string;
  fromVersion: string;
  toVersion: string;
  state: UpdateRunState;
  steps: UpdateStep[];
  /** The Time Travel bookmark taken before anything changed; absent until the restore point step is done. */
  bookmark?: string;
  /** The member who started it. */
  actor: string;
  startedAt: string;
  finishedAt?: string;
  error?: string;
}

const steps = (value: unknown): UpdateStep[] => {
  try {
    const parsed = JSON.parse(String(value)) as unknown;
    return Array.isArray(parsed) ? (parsed as UpdateStep[]) : [];
  } catch {
    // A row written by this module is always JSON; anything else has no steps.
    return [];
  }
};

export const toUpdateRun = (r: Row): UpdateRun => ({
  id: String(r.id),
  fromVersion: String(r.from_version),
  toVersion: String(r.to_version),
  state: String(r.state) as UpdateRunState,
  steps: steps(r.steps),
  ...(r.bookmark ? { bookmark: String(r.bookmark) } : {}),
  actor: String(r.actor),
  startedAt: String(r.started_at),
  ...(r.finished_at ? { finishedAt: String(r.finished_at) } : {}),
  ...(r.error ? { error: String(r.error) } : {}),
});
