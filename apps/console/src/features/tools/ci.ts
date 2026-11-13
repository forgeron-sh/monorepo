import { useEffect, useState } from "react";
import type { Api } from "../../api";
import { loadCi, type CiAnswer, type ToolRow } from "./api";

// What the CI of a tool that comes from GitHub says about a tool with nothing deployed yet: until its
// first version is up, the list and the tool page say what the CI is doing instead of "Not deployed".

export type Importing =
  | { kind: "importing"; runUrl: string }
  | { kind: "failed"; runUrl: string }
  | { kind: "waiting" };

/** Whether nothing was ever deployed to any channel: only then does the CI say anything. */
export const nothingDeployed = (tool: Pick<ToolRow, "production" | "previews" | "channels">) =>
  !tool.production && tool.previews.length === 0 && tool.channels.length === 0;

/**
 * What the CI is doing for a tool with nothing deployed: a run is going (**Importing**), the last one
 * failed (**CI failed**), or no run has been seen (**Waiting for CI**). The runs of the production
 * branch tell it, else any run. `undefined` where the CI cannot be read: no repository, no app, or
 * no permission to read Actions (the label stays "Not deployed").
 */
export function importingOf(answer: CiAnswer | undefined): Importing | undefined {
  if (!answer || answer.state !== "ok") return undefined;
  const onProduction = answer.runs.filter((r) => r.branch === answer.productionBranch);
  const runs = onProduction.length > 0 ? onProduction : answer.runs;
  // A cancelled run says nothing of the code: the last one that ran is the one that counts.
  const last = runs.find((r) => r.status !== "cancelled");
  if (!last) return { kind: "waiting" };
  return last.status === "failure"
    ? { kind: "failed", runUrl: last.url }
    : { kind: "importing", runUrl: last.url };
}

/** The words of each state, in the list and on the tool page. */
export const IMPORTING_LABEL = {
  importing: "Importing",
  failed: "CI failed",
  waiting: "Waiting for CI",
} as const;

/** What the CI says per tool name, read once for each tool that has nothing deployed (lazily, as rows come). */
export function useImporting(
  api: Api,
  tools: readonly ToolRow[] | undefined,
): Record<string, Importing | undefined> {
  const [states, setStates] = useState<Record<string, Importing | undefined>>({});
  const waiting = (tools ?? []).filter(nothingDeployed).map((t) => t.name);
  const key = waiting.join("\n");
  useEffect(() => {
    let live = true;
    for (const name of key === "" ? [] : key.split("\n")) {
      loadCi(api.fetchJson, name).then(
        (answer) => live && setStates((s) => ({ ...s, [name]: importingOf(answer) })),
        // A CI that cannot be read changes nothing: the tool is simply not deployed.
        () => undefined,
      );
    }
    return () => {
      live = false;
    };
  }, [api, key]);
  return states;
}
