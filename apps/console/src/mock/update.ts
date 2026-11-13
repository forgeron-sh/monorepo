// The platform updating itself (D-138) in the local harness: a newer release is waiting, the update
// goes step by step as time passes, and the answers are the gateway's. Pick the ending with
// `?update=`: `ok` (default), `failed` (stops at the deploy, after the migrations: the restore
// command shows), `blocked` (turned off), `current` (nothing newer). Names and ids are made up.

type Json = Record<string, any>;

const STEPS = ["download", "restore-point", "migrate", "code", "deploy"] as const;
const STEP_MS = 1500;
const NOTES = `## What is new

- Tools can be **updated from the console**.
- A new *Updates* panel in Install information.

Full list: [changelog](https://github.com/forgeron-sh/monorepo/blob/main/CHANGELOG.md)`;

export function createUpdateMock(search: string) {
  const ending = new URLSearchParams(search).get("update") ?? "ok";
  let current = "0.2.0";
  let startedAt: number | undefined;
  let to = "0.3.0";

  const run = (): Json | undefined => {
    if (startedAt === undefined) return undefined;
    const elapsed = Date.now() - startedAt;
    const reached = Math.floor(elapsed / STEP_MS);
    const failsAt = ending === "failed" ? STEPS.indexOf("deploy") : -1;
    const steps = STEPS.map((name, i) => {
      if (failsAt === i && reached >= i + 1) {
        return {
          name,
          state: "failed",
          message: "Cloudflare refused the new version (simulated).",
        };
      }
      if (i < reached && (failsAt < 0 || i < failsAt)) {
        return { name, state: "done", message: MESSAGE[name] };
      }
      if (i === reached && (failsAt < 0 || i <= failsAt)) return { name, state: "running" };
      return { name, state: "pending" };
    });
    const failed = steps.some((s) => s.state === "failed");
    const done = !failed && reached >= STEPS.length;
    if (done) current = to;
    return {
      id: "run-1",
      from: "0.2.0",
      to,
      state: failed ? "failed" : done ? "succeeded" : "running",
      steps,
      ...(reached >= 2 ? { bookmark: "00000085-0000f3a5-simulated" } : {}),
      startedAt: new Date(startedAt).toISOString(),
      ...(failed || done ? { finishedAt: new Date().toISOString() } : {}),
      ...(failed
        ? {
            error:
              "Cloudflare refused the new version (simulated). The database may already have changed: restore it to the restore point to go back.",
            restoreCommand:
              "wrangler d1 time-travel restore forgeron-platform --bookmark 00000085-0000f3a5-simulated",
          }
        : {}),
    };
  };

  const MESSAGE: Record<(typeof STEPS)[number], string> = {
    download: "Downloaded 3.4 MB; the checksum matches the release.",
    "restore-point": "The database can be restored to 00000085-0000f3a5-simulated.",
    migrate: "Applied 1 migration: 0043_platform_updates.",
    code: "Kept the gateway and its 54 console files.",
    deploy: "Version 0.3.0 is deployed at 100 %.",
  };

  return {
    /** The version the gateway reports: it changes when an update succeeds. */
    version: () => {
      run();
      return current;
    },
    /** `undefined` for a path that is not an update route. */
    route(path: string, method: string, body: Json): { status: number; body: Json } | undefined {
      if (path === "/api/platform/update" && method === "GET") {
        const live = run();
        const base = { current: { version: current, commit: "f95958b0c1a2" } };
        const blocked =
          ending === "blocked"
            ? {
                code: "OFF",
                message:
                  "Updating from the console is turned off on this install (SELF_UPDATE=off).",
              }
            : undefined;
        if (blocked) return { status: 200, body: { ...base, available: false, blocked } };
        const available = ending !== "current" && current !== to;
        return {
          status: 200,
          body: {
            ...base,
            latest: {
              version: ending === "current" ? current : to,
              publishedAt: "2026-11-13T09:30:00.000Z",
              url: "https://github.com/forgeron-sh/monorepo/releases/tag/v0.3.0",
              notes: NOTES,
            },
            available,
            ...(available ? { pending: { migrations: ["0043_platform_updates"] } } : {}),
            ...(live?.state === "running" ? { running: live } : {}),
            ...(live?.state === "failed" ? { lastFailed: live } : {}),
          },
        };
      }
      if (path === "/api/platform/update" && method === "POST") {
        if (run()?.state === "running") {
          return {
            status: 409,
            body: { error: "RUNNING", message: "An update is already running." },
          };
        }
        to = String(body.version);
        startedAt = Date.now();
        return { status: 202, body: { run: run() } };
      }
      if (path === "/api/platform/update/runs/run-1" && method === "GET") {
        const live = run();
        return live
          ? { status: 200, body: { run: live } }
          : { status: 404, body: { error: "NOT_FOUND", message: "There is no such update." } };
      }
      return undefined;
    },
  };
}
