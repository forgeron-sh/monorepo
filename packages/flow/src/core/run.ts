// Run state: where each node and edge stands while a flow runs, to show a run (or a test) on the
// canvas. Only the shapes live here, since the editor and the plugins share them; `planRun`, which
// turns a graph into the frames of a run, is the `run` plugin (`../plugins/run.ts`). A node that
// failed and sent its failure out through an error port (to a retry, a dead-letter queue) is
// `handled`: it failed, the flow went on; it is drawn as a failure, not as a success.

/**
 * `handled`: the node failed and its failure went on through one of its outputs (an `error` port
 * to a retry): a failure the flow caught, shown as one.
 */
export type RunStatus = "idle" | "running" | "success" | "error" | "handled" | "skipped";

export interface RunState {
  nodes: Readonly<Record<string, RunStatus>>;
  edges: Readonly<Record<string, RunStatus>>;
}

export const IDLE_RUN: RunState = { nodes: {}, edges: {} };

export const nodeStatus = (run: RunState | undefined, id: string): RunStatus =>
  run?.nodes[id] ?? "idle";
export const edgeStatus = (run: RunState | undefined, id: string): RunStatus =>
  run?.edges[id] ?? "idle";

/**
 * What one node did: succeeded through some of its outputs (all by default), or failed. A failure
 * stops there, unless it names `ports` (its error output): those carry it on and the node is
 * `handled`.
 */
export type NodeOutcome =
  | { status: "success"; ports?: ReadonlyArray<string> }
  | { status: "error"; ports?: ReadonlyArray<string> };

/** How many nodes stand in each state. */
export function countStatuses(run: RunState, ids: Iterable<string>): Record<RunStatus, number> {
  const out: Record<RunStatus, number> = {
    idle: 0,
    running: 0,
    success: 0,
    error: 0,
    handled: 0,
    skipped: 0,
  };
  for (const id of ids) out[nodeStatus(run, id)]++;
  return out;
}
