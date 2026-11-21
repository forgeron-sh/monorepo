# Contract: `schedule`

> Status: proposal (21 November 2026). Version `schedule@1`. Prefix `SCHED`. Mirrors Cloudflare Cron Triggers. See [README](README.md).

## 1. Purpose

Tasks a tool runs on its own, at set times: a nightly sync, a Monday summary, a cleanup. A task is a file in `jobs/` with a cron expression and a time zone; it runs as the tool, not as a person. The contract splits the work in two: the **provider** delivers a tick, once a minute, with its nominal time; the **runtime** decides which tasks are due at that minute in their own time zone and runs them. A due run may be missed or may happen twice: a task must be safe to run again and must not depend on running at every tick.

## 2. Declaration

Tasks are not declared in `resources`: they are inferred from `jobs/` (`sdk.md` §3, §9) and stored in the manifest as `jobs: { <name>: { cron, timezone?, description? } }` (`JobSchema`, `packages/manifest/src/schema.ts`).

```ts
// jobs/sync-sharepoint.ts (templates/inventory)
import { schedule } from "@forgeron/sdk";
export default schedule("0 2 * * *", { timezone: "Europe/Paris" }, async (ctx) => {
  /* … */
});
```

Nothing names a product; it stays. The admin sees "1 scheduled task: …" at installation.

## 3. Interface

What a provider implements (`@forgeron/contracts`):

```ts
/** What the provider hands the runtime once a minute, for one tool and channel. */
export interface Tick {
  /**
   * The minute the tick stands for, in UTC, at second 0 (Cloudflare's `controller.scheduledTime`).
   * Not the time it was delivered (SCHED-N2).
   */
  readonly scheduledTime: Date;
}

/** The tool's side: the runtime implements it; the provider calls it. */
export interface Scheduled {
  /** Runs the tasks due at `tick.scheduledTime`; resolves with their names. */
  scheduled(tick: Tick): Promise<string[]>;
}
```

The runtime side exists: `Runtime.scheduled(now)` calls `jobsDue(now)` then `runJob` for each, sequentially, logging a failure and going on (`packages/runtime/src/runtime.ts`, `engine.ts`). The cron expression is parsed by the runtime (`packages/runtime/src/cron.ts`), never by the provider, so the syntax is the same everywhere.

What a task sees: the action `ctx` with `user = { id: "tool:<name>", … }`, `interface: "job"`, `can()` always `false`, no `userSecrets`, no setup values (`engine.ts`, `runJob`).

Where today's code differs:

- **Nothing delivers ticks on Cloudflare.** The generated Worker exports `scheduled` (`packages/compiler/src/build.ts`), and the runtime expects a tick every minute. I found no code in `packages/hosting` or `apps/gateway` that registers a cron trigger on a tool's Worker (no `schedules`, `crons` or `triggers` in the upload metadata or the API calls). On a deployed tool, tasks run only through `forgeron jobs run`.
- **Local mode** (Miniflare, `packages/hosting/src/local.ts`) configures no cron either; `createTestTool().scheduled(now)` is the only way tasks run outside a manual call.

## 4. Guarantees

| Id       | Guarantee                                                                                                                                                                                                                                                                                                           | Cloudflare source                                                                                                                                                                                                                                                                                       | Anvil                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| SCHED-01 | **Syntax.** Five fields (minute, hour, day of month, month, day of week), `*`, `?`, lists, ranges, steps, and names (`JAN`, `MON`). Day of week 0 or 7 is Sunday. When both day fields are restricted, either one matches. An invalid expression or time zone fails at build and at startup, not at the first tick. | Parsed by the runtime, not by Cloudflare. Note: Cron Triggers number weekdays "1 = Sunday through 7 = Saturday" and accept `L`, `W`, `#` ([Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)); neither applies, since the provider's trigger is always `* * * * *` | same runtime code                                                             |
| SCHED-02 | **Time zone.** A task is due when the wall-clock minute in its `timezone` (default: the workspace's, else UTC) matches the expression.                                                                                                                                                                              | Cron Triggers "execute on UTC time" ([Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)); the zone is applied by the runtime (`matchesCron`)                                                                                                                       | same                                                                          |
| SCHED-03 | **Never early.** A task never runs before the minute it is due.                                                                                                                                                                                                                                                     | `scheduledTime` is the nominal time ([Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/))                                                                                                                                                                           | the timer fires at or after the minute                                        |
| SCHED-04 | **Nominal time.** The runtime decides with `scheduledTime`, so a tick delivered late still runs the tasks of its own minute, not of the current one.                                                                                                                                                                | `controller.scheduledTime`                                                                                                                                                                                                                                                                              | `Tick.scheduledTime` is the minute, at second 0                               |
| SCHED-05 | **Best effort, once per due minute.** In normal operation a due task runs once.                                                                                                                                                                                                                                     | No delivery guarantee is stated; "scheduled invocations can be missed while a configuration change is propagating" (up to 15 min) ([Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)): at-least-once is **UNVERIFIED**, hence SCHED-N1                            | a `ticks` table: one row per tool, channel and minute, claimed before running |
| SCHED-06 | **Tool identity.** A task runs as `tool:<name>`, with the tool's secrets, connectors in `application` mode, and no person's data.                                                                                                                                                                                   | runtime                                                                                                                                                                                                                                                                                                 | same                                                                          |
| SCHED-07 | **A failure is logged, not retried.** A task that throws is logged with its name; other due tasks still run; the next due minute runs it again.                                                                                                                                                                     | runtime (`scheduled` catches each task)                                                                                                                                                                                                                                                                 | same                                                                          |
| SCHED-08 | **Duration.** A task may run for up to 15 minutes of wall time and 30 s of CPU.                                                                                                                                                                                                                                     | Cron wall time 15 min; CPU 30 s by default on Paid ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/))                                                                                                                                                                       | enforced: the call is cancelled at 15 min                                     |
| SCHED-09 | **Isolation.** A tool's ticks run only its own tasks, on its own channel, with that channel's database and secrets.                                                                                                                                                                                                 | one Worker per channel                                                                                                                                                                                                                                                                                  | one timer row per tool and channel                                            |
| SCHED-10 | **Manual run.** `forgeron jobs run <name> [--env]` runs a task now, through the same `runJob`, whatever its expression.                                                                                                                                                                                             | runtime                                                                                                                                                                                                                                                                                                 | same                                                                          |

## 5. Non-guarantees

| Id       | A tool must not rely on                                                                                                                                                                                                                                   | Anvil dev chaos                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| SCHED-N1 | **Exactly once.** A due run may be **missed** (propagation after a deploy, an outage) or **run twice**. Make a task idempotent and let it catch up: read "what changed since the last successful run" from the database, not "since one period ago".      | skip 2 % of ticks; deliver 2 % twice                                         |
| SCHED-N2 | **Punctuality.** A tick may arrive late; `ctx.now()` in the task is the real time, not the due time.                                                                                                                                                      | deliver ticks 0–90 s late                                                    |
| SCHED-N3 | **No overlap.** A run longer than the period overlaps the next run of the same task.                                                                                                                                                                      | run each task a second time while it is still running, once per hundred runs |
| SCHED-N4 | **Order between tasks due at the same minute.** Today they run one after another in manifest order; a provider may run them concurrently.                                                                                                                 | run them in random order, concurrently                                       |
| SCHED-N5 | **Daylight saving.** In a zone with DST, a wall-clock minute that does not exist is skipped (`30 2 * * *` in Europe/Paris on the last Sunday of March does not run), and one that occurs twice runs twice. Schedule outside 01:00–03:00 local, or in UTC. | none: it is the runtime's own behaviour, the same everywhere                 |
| SCHED-N6 | **Catch-up.** A missed minute is not run later.                                                                                                                                                                                                           | follows from SCHED-N1                                                        |
| SCHED-N7 | **Running right after a deploy or a schedule change.** Changes take effect within 15 min on Cloudflare ([Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)).                                                         | ignore new and changed tasks for 0–5 min after a deploy                      |
| SCHED-N8 | **Tasks running on a branch's temporary channel.** See open question 2.                                                                                                                                                                                   | none                                                                         |

## 6. Limits

| Id        | Limit                     | Cloudflare                                                                                                                                                                                      | Contract                                       |
| --------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| SCHED-L01 | Granularity               | one minute (five-field cron)                                                                                                                                                                    | one minute                                     |
| SCHED-L02 | Wall time of a run        | 15 min ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/))                                                                                                           | 15 min                                         |
| SCHED-L03 | CPU time of a run         | 30 s default for intervals under 1 h, up to 5 min configured; 15 min for intervals of 1 h or more; 10 ms on Free ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)) | 30 s, for all tasks of one tick together       |
| SCHED-L04 | Cron triggers per account | 5 (Free), 1,000 (Paid) ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/))                                                                                           | not a tool limit: see open question 1          |
| SCHED-L05 | Propagation of a change   | up to 15 min ([Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/))                                                                                          | up to 15 min                                   |
| SCHED-L06 | Tasks per tool            | —                                                                                                                                                                                               | 20 (proposed)                                  |
| SCHED-L07 | Subrequests per run       | 10,000 (Paid) ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/))                                                                                                    | 1,000, the database's per-call figure (DB-L07) |

## 7. Errors

Raised at build or startup, never at a tick:

| Code                     | When                                                                  |
| ------------------------ | --------------------------------------------------------------------- |
| `SCHED_CRON_INVALID`     | The expression does not have five valid fields (`parseCron` message). |
| `SCHED_TIMEZONE_INVALID` | The time zone is not a known IANA name (`zoneFormatter` throws).      |
| `SCHED_TOO_MANY`         | Over SCHED-L06.                                                       |

At run time:

| Code                 | Retryable            | When                                                             |
| -------------------- | -------------------- | ---------------------------------------------------------------- |
| `SCHED_TIMEOUT`      | no (next due minute) | A run went over SCHED-L02 or L03; it is logged like any failure. |
| `SCHED_UNKNOWN_TASK` | no                   | `forgeron jobs run` names a task the version does not have.      |

## 8. Conformance

| Case       | Proves      | What it does                                                                                        |
| ---------- | ----------- | --------------------------------------------------------------------------------------------------- |
| SCHED-01.a | SCHED-01    | a table of expressions against dates (the cases of `cron.test.ts`), the same on every provider      |
| SCHED-01.b | SCHED-01    | an invalid expression and an unknown zone fail the build                                            |
| SCHED-02.a | SCHED-02    | `0 9 * * *` in `Asia/Tokyo` is due at 00:00 UTC                                                     |
| SCHED-03.a | SCHED-03    | over 24 h of ticks, no task starts before its minute (provider clock against `scheduledTime`)       |
| SCHED-04.a | SCHED-04    | a tick for 02:00 delivered at 02:03 runs the 02:00 task, not the 02:03 one                          |
| SCHED-05.a | SCHED-05    | a `* * * * *` task over 60 min in `serve`: 60 runs (Anvil); 55 or more (Cloudflare probe, measured) |
| SCHED-06.a | SCHED-06    | a task sees `ctx.user.id === "tool:<name>"`, `ctx.interface === "job"`, empty `userSecrets`         |
| SCHED-07.a | SCHED-07    | of two due tasks, the first throws: the second runs; the failure is in the log                      |
| SCHED-08.a | SCHED-08    | a run that sleeps past 15 min is cancelled with `SCHED_TIMEOUT`                                     |
| SCHED-09.a | SCHED-09    | two channels of one tool: each tick writes to its own database                                      |
| SCHED-N.a  | SCHED-N1–N4 | Anvil dev: a skipped, a doubled, a late and an overlapping run each happen in 1,000 ticks           |
| SCHED-N.b  | SCHED-N5    | Europe/Paris on 2027-03-28 and 2027-10-31: `30 2 * * *` runs 0 and 2 times                          |

## 9. Open questions

1. **One trigger per tool channel, or one for the platform.** The runtime needs a tick every minute. A `* * * * *` trigger on every tool Worker spends one of the account's 1,000 cron triggers (5 on Free) per channel that has tasks, and every branch's channel would take one. Converting each task's expression to UTC triggers is not possible with time zones and DST. Recommendation: **one minute trigger on the gateway**, which calls `scheduled` on each tool channel that has due tasks (the gateway can evaluate `jobsDue` from the manifests it holds, and only wakes those). It costs one trigger per install and no trigger per tool.
2. **Which channels run tasks.** Today every channel's Worker would, a branch's included: a nightly sync on twenty branches calls the upstream twenty times. Recommendation: production and permanent channels run tasks; temporary branch channels run them only through `forgeron jobs run`.
3. **At-least-once.** Reframing §4.1 says "UTC, at-least-once". Cloudflare does not state it, and says runs can be missed during propagation. Recommendation: the contract says best effort (SCHED-05, SCHED-N1); Anvil, which can, records a missed minute and runs it once when it comes back, but the contract does not promise it.
4. **Overlap.** Should the runtime refuse to start a task still running (a lease in the database)? Recommendation: not in `schedule@1`; a task that cares takes its own lease in its database with a guarded `UPDATE` (DB-N1).
5. **Default time zone.** Tasks without `timezone` use the workspace's zone, which the Worker does not receive today (`timeZone` defaults to UTC in `createRuntime`). Recommendation: the gateway passes it with the tick; until then the manifest should require `timezone`.
