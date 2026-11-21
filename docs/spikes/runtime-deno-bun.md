# Spike: can Deno or Bun be the JavaScript engine under Anvil?

Written 2026-11-21. Hands-on: everything below was run on this machine except what "Not tested" lists.
A parallel spike tests supervising `workerd`; this one tests the alternatives. Nothing was committed, the
repository was only read (one real build output was copied out to run it), and the code of the spike lives
outside the repository, in the session scratchpad (`.../scratchpad/spike-deno-bun/`, about 300 lines of
adapter, hosts and harnesses; the key parts are inlined or summarised below).

Labels used: **fact** (measured or read, with the command or the URL), **deduction** (follows from facts, not
run), **hypothesis** (plausible, nothing run says so).

## Verdict

1. **Both engines run a Workers-shaped bundle unchanged.** A real Forgeron build (`apps/cli/fixtures/dbping`,
   687 KB, the Forgeron runtime + Kysely, `export default { fetch, scheduled }`) answers byte-for-byte the same
   on Deno 2.9.8 and Bun 1.4.4 through a **97-line D1 / KV / R2 adapter** (about 160 lines with the host and a
   `WebSocketPair` shim). No bundle change, no polyfill for that bundle. The work is in the adapter's edge
   cases (D1 binding rules, foreign keys, missing `caches`/`HTMLRewriter`), not in the engines.
2. **Process per tool wins over worker per tool, for both engines.** A process costs about 2x the memory of
   a worker and about 10 ms more at start, and in exchange it is the only model where the three things we
   need are all true: memory returns to the OS on eviction, a runaway tool is killed for sure, and a crash or
   out-of-memory takes down one tool only. Deno workers fail all three in measurements (a worker running
   `for(;;){}` keeps its thread at about 72% CPU after `terminate()`; a heap-limit OOM in one worker aborts the
   whole process; 50 spawned then terminated workers leave 530 MB resident).
3. **Deno has the isolation story, Bun has none.** Per process, `--allow-read=<tool dir>` etc. stop tool A
   from reading tool B's database, the environment, the network and `child_process`: demonstrated. Bun has
   no permission model (`bun --help` lists none) and no memory cap (`--smol` and `BUN_JSC_forceRAMSize` did
   not stop a runaway allocation, killed by my guard at 2.5 GB): tool A read tool B's database and spawned a
   shell. With Bun the sandbox has to come from the OS (containers, Landlock/seccomp, cgroups) and that is
   Linux work that was not tested here.
4. **Bun is 1.5 to 2x lighter and faster; Deno is fast enough.** Spawn to first response, median of 10:
   Deno 27-35 ms (22 ms as a `deno compile` binary), Bun 14-22 ms (12 ms compiled). Idle process: Deno
   19-28 MB physical footprint (51-60 MB RSS), Bun 9-16 MB (21-35 MB RSS). Both clear "starts in
   milliseconds, costs almost nothing idle". 300 tools resident would be about 6-8 GB on Deno, 3-5 GB on Bun,
   but with eviction only the busy ones are resident.
5. **Neither can be embedded in the Rust binary at no cost.** Bun: no embedding API (a draft PR for one,
   oven-sh/bun#39362, was closed unmerged on 2026-08-16; the request #12017 is open). Deno: embedding is
   possible with the `deno_runtime` and `deno_core` crates (both published monthly, 0.268.0 and 0.413.0 on
   2026-10-21) but `deno_runtime`'s own README says its API "is subject to rapid and breaking changes", and
   it was not built here. The realistic shape today is **Anvil as a Rust supervisor that spawns an engine
   process per tool** (a sidecar binary shipped inside or next to `anvil`).
6. **Ranking for Anvil** (details in "Verdict and ranking" at the end):
   1. Deno, process per tool, strict permissions and a heap cap.
   2. Bun, process per tool, only with an OS sandbox added by the supervisor.
   3. Deno workers (acceptable for `anvil dev`, not for `anvil serve`).
   4. Bun workers (same, weaker).
      And the option this spike could not measure but that the findings point to: embedding `deno_runtime` and
      running one V8 isolate per tool in the Rust process, which is the only route to per-tool memory and CPU
      limits without a process each. It deserves its own spike before committing to the sidecar for good.
7. **Fidelity with real Workers is the risk to manage, not the engines' speed.** A conformance suite that
   runs the same requests on workerd, on Cloudflare and on Anvil is the answer (last section).

## Question

Anvil must host many Workers-shaped bundles (tens to a few hundred tools and their previews per
installation) without Cloudflare, with serverless properties: a tool that is idle costs almost nothing,
starts in milliseconds, and is isolated from the others. Can Deno or Bun be the JavaScript engine, what does
each hosting model cost, how are tools isolated, how does it package under a Rust binary, which of their
built-in services map onto our contracts (`database`, `kv`, `blob`, `queue`, `schedule`, `realtime`,
`workflow`), and how far will behaviour drift from real Workers?

## Method

Machine and versions (fact):

| Item    | Value                                                                                                                                                                                                       |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Machine | Apple M4, 10 cores, 16 GB, macOS 27.2 (Darwin 27.2.0), local SSD                                                                                                                                            |
| Deno    | 2.9.8 stable (V8 15.0.245.2-rusty, TypeScript 6.0.3), `/opt/homebrew/bin/deno`                                                                                                                              |
| Bun     | 1.4.4 (`~/.proto/tools/bun/1.4.4/bun`). The repository pin is 1.4.3, and from outside the repository the proto shim resolves 1.3.14: used 1.4.4 because 1.3.14 has no `node:sqlite`, see below              |
| Node    | 24.21.0, only for the harness (it spawns, times, reads `ps` and `footprint`)                                                                                                                                |
| Load    | not a quiet machine: load average 3 to 4 from other sessions during every run. Where a first run was visibly disturbed (Deno 44 ms against 27 ms the next time) the table gives the range of the quiet runs |

Measurements: "spawn to first response" is the time from `spawn()` in the harness to the end of the first
HTTP response, new process each time, median of 10 after one dropped warm-up. Memory is `ps -o rss` (counts
shared pages, so it overstates) and macOS `footprint -p` (`phys_footprint`, the number to trust), after the
tool served one request and sat idle 3 s. Latency is a Node `http` client with keep-alive, 4000 requests
after 300 warm-up, one connection and 32 connections. Every run uses the same tiny bundle, a synthetic
737 KB bundle (2500 functions evaluated at load) and the real 687 KB Forgeron bundle, so size effects show.

What was built (fact; the code is in the scratchpad):

- `bundle/tool.js`: a Workers-shaped bundle, no engine-specific code, 99 lines. Routes exercise `env.DB`
  (`prepare().bind().all()/first()/run()`, `batch()` with rollback), `env.KV`, `env.BLOB`,
  `ctx.waitUntil`, `crypto.subtle`, `HTMLRewriter`, `caches`, `WebSocketPair`, `node:` imports,
  `AsyncLocalStorage`, a cron handler, and isolation probes (`/leak`, `/spin`, `/alloc`).
- `adapter/env.js` (97 lines): `D1` and `D1Statement` over any SQLite handle with `exec/prepare().all/run`
  (about 35 lines), `KV` on a SQLite table with `expirationTtl`, `list({prefix})` (about 25), `R2` on the
  filesystem (about 25), `makeCtx` with a `waitUntil` set that is drained on shutdown.
- `adapter/ws.js` (10 lines): `WebSocketPair` and a `Response` subclass that keeps `init.webSocket`.
- `adapter/host.js` (51 lines): opens SQLite (`node:sqlite` `DatabaseSync` on Deno, `bun:sqlite` `Database` on
  Bun), builds `env`, calls `default.fetch(req, env, ctx)`, serves with `Deno.serve` or `Bun.serve`, bridges
  the `WebSocketPair` to a real socket, answers `POST /__scheduled` by calling `default.scheduled`.
- `proc.js`: one OS process per tool. `worker.js` + `main-workers.js`: one process, one `Worker` per tool.
- Harnesses: `bench-cold.mjs`, `bench-scale.mjs`, `bench-workers.mjs`, `bench-lat.mjs`, `bench-churn.mjs`,
  `limits.mjs`, `spin*.mjs`, `quirks.js`, `bench-real.mjs`.

Commands, exact (from the spike directory, `PATH=$HOME/.proto/shims:$PATH`, `BUN=$HOME/.proto/tools/bun/1.4.4/bun`):

```text
deno run -A proc.js bundle/tool.js data/t1 0              # process per tool, Deno, no limits
deno run --allow-read=$R/adapter,$R/bundle,$R/proc.js,$R/data/a --allow-write=$R/data/a \
         --allow-net=127.0.0.1:18110 proc.js bundle/tool.js data/a 18110    # strict
$BUN proc.js bundle/tool.js data/t1 0
deno run -A --unstable-worker-options main-workers.js     # worker per tool (needed for deno:{permissions})
$BUN main-workers.js
deno compile -A -o out/anvil-deno proc.js ; $BUN build --compile proc.js --outfile out/anvil-bun
```

## 1. Running a Workers bundle unchanged

### What worked (fact)

| Feature                                                                                             | Deno 2.9.8                                                          | Bun 1.4.4                                                    | Note                                                                                                                                 |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Real Forgeron build (687 KB), 6 requests (`db.ping`, `things.add`, `things.list`, 401, `/mcp`, 404) | identical responses                                                 | identical responses                                          | no change to the bundle; Kysely over the D1 adapter works                                                                            |
| `env.DB` prepare/bind/all/first/run/batch, batch rollback                                           | works                                                               | works                                                        | adapter code only                                                                                                                    |
| `env.KV` (TTL, list), `env.BLOB` (put/get/head/delete/list)                                         | works                                                               | works                                                        | KV in SQLite, blobs as files                                                                                                         |
| `ctx.waitUntil`                                                                                     | works                                                               | works                                                        | `SIGTERM` 5 ms after a 50 ms `waitUntil`: process exits after 55 ms, the write landed (both)                                         |
| `scheduled(ev, env, ctx)`                                                                           | works                                                               | works                                                        | called from `POST /__scheduled`                                                                                                      |
| `crypto.subtle` HMAC, SHA-256, AES-GCM, Ed25519, X25519                                             | works                                                               | works                                                        | `crypto.subtle.timingSafeEqual` and `crypto.DigestStream` (Workers-only) missing on both                                             |
| `node:` imports under `nodejs_compat`                                                               | 37 of 37 modules import                                             | 37 of 37 import                                              | a superset of what Workers offers, which is a fidelity risk in the other direction                                                   |
| `AsyncLocalStorage`, `Buffer`, `process.nextTick`, `structuredClone`                                | works                                                               | works                                                        |                                                                                                                                      |
| `WebSocketPair`, `new Response(null, { status: 101, webSocket })`                                   | missing; shim of 10 lines + 20 lines of bridge works                | missing; same shim works                                     | both runtimes accept status 101 in `Response`, so the shim only has to keep `init.webSocket`; echo tested with a real client on both |
| `HTMLRewriter`                                                                                      | **missing**                                                         | **present** (built-in, lol-html, the same engine as Workers) | for Deno an npm package of the same name exists; not tested, see "Not tested"                                                        |
| `caches` / `caches.default`                                                                         | `caches` exists (Cache API), no `caches.default`; one line fixes it | **no `caches` at all**                                       | semantics (what Workers stores, TTL, `cache-control`) not compared                                                                   |
| `request.cf`, `cf-*` headers                                                                        | absent                                                              | absent                                                       | the adapter would have to fake `cf`                                                                                                  |
| `navigator.userAgent`                                                                               | `Deno/2.9.8`                                                        | `Bun/1.4.4`                                                  | Workers returns `Cloudflare-Workers`                                                                                                 |

### D1 edge cases: where the adapter must decide (fact; `quirks.js`, same adapter, both engines)

The runtimes do not agree with each other, so they cannot all agree with D1. What I could not do is compare
with real D1 (no Cloudflare access): the right column is what the conformance suite must settle.

| Case                                          | Deno (`node:sqlite`) | Bun (`bun:sqlite`)       | Adapter decision                                                               |
| --------------------------------------------- | -------------------- | ------------------------ | ------------------------------------------------------------------------------ |
| `bind(true)`                                  | throws `TypeError`   | binds `1`                | convert booleans to 0/1 (or throw, as D1 decides)                              |
| `bind(undefined)`                             | throws               | binds NULL silently      | D1 is documented to reject `undefined`; throw `D1_TYPE_ERROR` (to verify)      |
| `bind(new Date())`                            | binds (as text)      | throws                   | reject, or ISO string, per D1 (to verify)                                      |
| `PRAGMA foreign_keys` default                 | **1 (on)**           | **0 (off)**              | D1 enforces foreign keys: the adapter must run `PRAGMA foreign_keys=ON` on Bun |
| integer above 2^53 on read                    | throws `RangeError`  | silently loses precision | D1 returns a JS number; pick a rule                                            |
| SQLite version                                | 3.54.1               | 3.54.0                   | both have JSON1, FTS5, `RETURNING`, `unixepoch`, math functions                |
| blob column read                              | `Uint8Array`         | `Uint8Array`             | D1 returns an array of numbers; convert                                        |
| `meta` (`changes`, `last_row_id`, `duration`) | from `run()`         | from `run()`             | `rows_read`, `size_after` are zeros                                            |

### How much adapter, and what is not in it (fact + deduction)

- The adapter that ran a production-shaped bundle is **97 + 10 + 51 lines**. A production one needs more:
  the edge-case rules above, `caches.default` on Bun, `HTMLRewriter` on Deno, `request.cf`,
  `env.QUEUE.send` and a `queue(batch, env, ctx)` consumer, service bindings, secrets as `env` strings, a
  timeout per request, and the `Response.json`/error page shape Cloudflare returns on an uncaught error
  (here it returns 500 and the message). **Deduction: about 400 to 600 lines of TypeScript**, shared by both
  engines (the whole spike adapter is engine-neutral except one `open()` function and the serve/upgrade code).
- Durable Objects, Workflows, Service bindings, Hyperdrive, Workers AI, Browser Rendering, Analytics Engine:
  not built, not tested. Forgeron's SDK contract only uses D1, R2, KV, Queues, cron and its own realtime
  header, so the first four are what matters (`docs/sdk.md` sections 8 to 10).
- **Bun 1.4.4 has `node:sqlite`** (fact: `import("node:sqlite")` works; on 1.3.14 it does not), so one adapter
  could use `node:sqlite` on both; the spike used `bun:sqlite` on Bun because it is the native one.

## 2. Hosting models, measured

### 2a. One OS process per tool (fact)

Spawn to first response, median of 10 (min-max in the right column), `/db` request (opens SQLite, creates
a table, inserts, reads). "Hello" is an empty server in the runtime, to show the floor.

| Target                                 | Tiny bundle | Synthetic 737 KB | Real 687 KB Forgeron build | Range seen across runs |
| -------------------------------------- | ----------- | ---------------- | -------------------------- | ---------------------- |
| Deno hello (`-A`)                      | 22 ms       |                  |                            |                        |
| Bun hello                              | 10 ms       |                  |                            |                        |
| Deno + adapter, `-A`                   | 27-35 ms    | 33-35 ms         | 34 ms                      | 25-107 under load      |
| Deno + adapter, strict flags           | 27-30 ms    | 32-37 ms         | 33 ms                      |                        |
| Bun + adapter                          | 14-15 ms    | 20-22 ms         | 26 ms                      | 13-42 under load       |
| `deno compile` binary (65.1 MB)        | 22 ms       |                  |                            | 22-23                  |
| `bun build --compile` binary (85.0 MB) | 12 ms       |                  |                            | 12-13                  |

Idle memory per tool, after one request and 3 s of rest (fact; `bench-scale.mjs`, `bench-real.mjs`):

| Runtime             | Tiny RSS / footprint | 737 KB RSS / footprint | Real 687 KB RSS / footprint | 50 tools, tiny (footprint total) | 50 tools, 737 KB (footprint total) |
| ------------------- | -------------------- | ---------------------- | --------------------------- | -------------------------------- | ---------------------------------- |
| Deno `-A` or strict | 51 / 19 MB           | 57 / 25 MB             | 60 / 27-28 MB               | 950 MB                           | 1.24 GB                            |
| Bun                 | 21 / 9 MB            | 26 / 12 MB             | 35 / 16 MB                  | 439 MB                           | 590 MB                             |

1, 10 and 50 tools gave the same per-tool numbers: no cross-tool effect, which is what separate processes
should do. Starting 50 processes (10 at a time) took 0.48 s on Deno, 0.13 s on Bun. **Deduction** for 300
tools all resident: Deno 5.7 to 8.4 GB of footprint, Bun 2.7 to 4.8 GB. A tool that is not resident costs
nothing.

Request latency, one process, keep-alive client (fact; `bench-lat.mjs`; the client is Node, which sets the
floor):

| Path                                   | Deno p50 / p99 (1 conn) | Bun p50 / p99 (1 conn) | Deno req/s (32 conn) | Bun req/s (32 conn) |
| -------------------------------------- | ----------------------- | ---------------------- | -------------------- | ------------------- |
| hello, no adapter                      | 25 / 71 us              | 24 / 76 us             | 58,900               | 72,000              |
| bundle `/ping` (adapter in path)       | 29 / 196 us             | 29 / 48 us             | 33,500               | 77,000              |
| bundle `/db` (insert + select + count) | 74 / 232 us             | 56 / 102 us            | 14,600               | 25,300              |
| bundle `/kv`                           | 66 / 98 us              | 55 / 111 us            | 28,100               | 31,800              |

The adapter adds under 5 us to a trivial request; a D1-shaped request is 55 to 75 us. The hop from the
Rust supervisor to the engine process is not in these numbers (not measured: **hypothesis** 20 to 60 us
over a Unix socket). Both engines serve on a Unix socket (`Deno.serve({ path })`, `Bun.serve({ unix })`,
tested with `curl --unix-socket`), so 300 tools do not need 300 TCP ports.

**Scale to zero** (fact): a tool is evicted by `SIGTERM` (the host drains `waitUntil`, 55 ms in the test) or
`SIGKILL`; the memory returns completely; the next request pays the spawn: Deno 27-35 ms, Bun 14-26 ms (22
and 12 ms with `compile`). The state of a tool lives in its SQLite files and survives. Tested flags that did
not change Deno's start: `--no-config --no-lock --no-remote --cached-only`, `--v8-flags=--lite-mode`
(26 ms against 25-26 ms).

### 2b. One process, one `Worker` per tool (fact)

`main-workers.js`: the main thread keeps a map name to Worker; `new Worker(worker.js)` boots the adapter and
the bundle; requests go either to the worker's own port or through `postMessage` (the main thread serves,
posts `{method,url,headers,body}`, gets `{status,headers,body}` back). Deno's strict variant passes
`deno: { permissions: { read: [adapter, bundle, own dir], write: [own dir], net: false, env: false, run:
false, ffi: false } }` and needs `--unstable-worker-options`.

|                                                        | Deno `-A`      | Deno strict permissions | Bun           |
| ------------------------------------------------------ | -------------- | ----------------------- | ------------- |
| `new Worker` to ready, median of 10 (tiny / 737 KB)    | 16.4 / 19.8 ms | 16.9 / 21.1 ms          | 6.1 / 12.4 ms |
| to first response (tiny / 737 KB)                      | 18.3 / 21.4 ms | 18.8 / 22.8 ms          | 7.3 / 13.6 ms |
| process with 1 worker, RSS / footprint                 | 71 / 40 MB     | 71 / 40 MB              | 51 / 16 MB    |
| marginal cost per worker at 10 (RSS / footprint, tiny) | 8.7 / 9.5 MB   | 8.7 / 9.4 MB            | 4.2 / 3.6 MB  |
| marginal cost per worker at 50 (RSS / footprint, tiny) | 10.4 / 11.1 MB | 10.3 / 11.0 MB          | 5.0 / 4.0 MB  |
| process with 50 workers (tiny / 737 KB), footprint     | 593 / 799 MB   | 586 / 796 MB            | 214 / 343 MB  |
| p50 via `postMessage`, `/ping`, 1 conn                 | 65 us          | 63 us                   | 47 us         |
| p50 to the worker's own port, 1 conn                   | 34 us          |                         | 30 us         |

So a worker is about half a process in memory and about 10 ms faster to start (Deno), a bit less than that
on Bun, and it needs no port when the main thread forwards through `postMessage` (a copy of the body, 15 to
20 us more).

**What eviction costs** (fact, `bench-churn.mjs`: 5 cycles of spawn 50 workers, one request each, terminate):

| After cycle       | Deno footprint | Bun footprint | Bun RSS |
| ----------------- | -------------- | ------------- | ------- |
| 0 (empty process) | 11 MB          | 5 MB          | 13 MB   |
| 1                 | **530 MB**     | 47 MB         | 253 MB  |
| 3                 | 557 MB         | 57 MB         | 464 MB  |
| 5                 | 561 MB         | 60 MB         | 543 MB  |

On Deno, `terminate()` does not give the memory back: it stays at the high-water mark (it plateaus, so it is
not an unbounded leak, about +6 MB a cycle). On Bun the footprint is returned but RSS keeps growing (cause
not investigated). **Eviction in a worker model therefore does not reduce the process's memory on Deno**,
and only the process model has real scale to zero.

### 2c. Anything lighter for Deno (fact where marked)

- `deno serve --parallel`: runs the same handler on N threads (`--help`: "Run multiple server workers in
  parallel"). It is for one app on many cores, not many apps; it does not help.
- `Worker` with `deno: { permissions }`: the isolation primitive of 2b. Requires `--unstable-worker-options`.
- `node:worker_threads` inside Deno: honours `resourceLimits` (memory cap, see section 3), **ignores
  per-worker permissions** (`deno: { permissions: { read: false } }` was passed and the worker read
  `/etc/hosts`). So per worker you get permissions **or** a memory cap, not both.
- `deno sandbox`: listed in `deno --help` as "Run in sandbox mode". It downloaded `@deno/deploy` from JSR when
  I asked for its help text, so it is the Deno Deploy cloud client, not a local isolation mode. Not pursued.
- Lighter than a Worker, in the Deno CLI: nothing. A per-tool V8 isolate with its own limits exists only
  through embedding `deno_runtime` (`WebWorker`), not measured here (section 4).

## 3. Isolation

### Deno, per process (fact: the strict command above, with Bun running tool B next to it)

Tool A, strict flags, asked to touch tool B's world:

| Probe                    | Result                                                                     |
| ------------------------ | -------------------------------------------------------------------------- |
| Read B's `db.sqlite`     | denied: `Requires read access to "<path>"`                                 |
| Read `process.env.HOME`  | denied: `Requires env access to "HOME"`                                    |
| `fetch` to B's port      | denied: `Requires net access to "127.0.0.1:<port>"`                        |
| `child_process.execSync` | denied                                                                     |
| Its own `/db`            | works (the allowed read/write paths are enough for `node:sqlite` with WAL) |

Same probes on Bun, no flags: B's database read (4096 bytes), `HOME` read, B's port reached (200), a shell
spawned. Bun's `--help` mentions no permission or sandbox option. **Bun has no sandbox in the runtime.**

Cautions on Deno's model (deduction from the docs and the flags, not tested): permissions stop JavaScript
APIs, not a bug in V8 or in Deno's native code, and not the CPU or the memory. Run with `--no-prompt` so a
denied permission fails instead of waiting for a terminal. The network permission is host-level: a tool that
may call `odoo.example.com` is allowed to call it, which matches a manifest allow-list.

### Deno, per worker (fact)

`deno: { permissions }` on `new Worker` works as in a process (the same four probes were denied for a
worker). But in a worker the limits are weak:

| Limit                                              | Deno web `Worker`                                                               | Deno `node:worker_threads`                                                                                                         | Bun `Worker`                   |
| -------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Per-worker permissions                             | yes (unstable flag)                                                             | no (ignored)                                                                                                                       | no                             |
| Per-worker memory cap                              | no (`resourceLimits` ignored; guard killed it at 1.6 GB)                        | **yes**: `resourceLimits: { maxOldGenerationSizeMb: 64 }` gives `ERR_WORKER_OUT_OF_MEMORY` after 69 ms, main thread alive at 59 MB | no (guard killed it at 2.3 GB) |
| `--v8-flags=--max-old-space-size=64` on the parent | a heap-limit OOM in a worker is a **fatal error that aborts the whole process** |                                                                                                                                    | not applicable                 |
| Neighbour keeps answering while one worker spins   | yes (3.5 ms)                                                                    |                                                                                                                                    | yes (1.5 ms)                   |
| `terminate()` stops `for(;;){}`                    | **no**: returns in 0.4 ms but the thread keeps about 72% CPU                    | no (same)                                                                                                                          | yes (CPU back to 0%)           |

### Memory and CPU, per process (fact; `limits.mjs`, a runaway `new Array(1e6).fill(1)` loop, guard at 2.5 GB)

| Runtime and flag                           | Result                                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Deno, no flag                              | grew to the 2.5 GB guard                                                                                                           |
| Deno `--v8-flags=--max-old-space-size=100` | process aborts in 0.1 s (`SIGTRAP`, "Reached heap limit"); other tools untouched; the supervisor sees the exit and answers 500/503 |
| Bun `--smol`                               | no effect, 2.6 GB at the guard                                                                                                     |
| Bun `BUN_JSC_forceRAMSize=67108864`        | no effect, 3.3 GB at the guard                                                                                                     |

CPU: a spinning tool is killed with `SIGKILL` (process model: nothing to check, the kernel does it).
Deno and Bun have no CPU-time limit of their own. Workers' 10 or 30 s CPU limit would have to be a
supervisor timer that kills the process (or, for Bun workers only, terminates the worker).

### What stops tool A from reading tool B (summary)

| Engine and model                 | Files       | Env         | Network     | Memory                         | Runaway CPU / OOM                                              |
| -------------------------------- | ----------- | ----------- | ----------- | ------------------------------ | -------------------------------------------------------------- |
| Deno, process, strict flags      | flags       | flags       | flags       | separate address space         | kill the process; `--max-old-space-size` aborts only that tool |
| Deno, worker, strict permissions | permissions | permissions | permissions | separate isolate, same process | `terminate()` does not stop a spin; an OOM aborts every tool   |
| Bun, process                     | nothing     | nothing     | nothing     | separate address space         | kill the process; no heap cap on macOS                         |
| Bun, worker                      | nothing     | nothing     | nothing     | separate isolate, same process | `terminate()` works; no cap, an OOM takes the process          |

For Bun on Linux, the supervisor could add `setrlimit`/cgroups, Landlock, seccomp, a network namespace per
process: **not tested** (macOS here), and it is what Anvil would have to build.

## 4. Embedding and packaging under a Rust binary

### Standalone binaries (fact)

|                                                       | Size                              | Notes                                                                                                                                                                                     |
| ----------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deno` (Homebrew)                                     | 125.5 MB                          |                                                                                                                                                                                           |
| `deno compile -A -o out/anvil-deno proc.js`           | 65.1 MB                           | smaller than `deno` itself; loads a bundle by path at runtime with a dynamic `import()` (the test bundle ran, loaded from a path given on the command line), permissions baked in by `-A` |
| `bun` 1.4.4                                           | 84.6 MB                           |                                                                                                                                                                                           |
| `bun build --compile proc.js --outfile out/anvil-bun` | 85.0 MB                           | same: dynamic `import()` of an external bundle works; the runtime is the whole of Bun                                                                                                     |
| `anvil-deno` idle                                     | 38 MB RSS, 16 MB footprint, 22 ms |                                                                                                                                                                                           |
| `anvil-bun` idle                                      | 20 MB RSS, 8 MB footprint, 12 ms  |                                                                                                                                                                                           |

So **a compiled host can load tool bundles from disk at runtime**: the engine ships as one file, the bundles
stay data. The Rust `anvil` binary would embed it (Deno: 65 MB) or ship it beside itself and extract it on
first run. Not tested: shipping on Linux, code signing and notarisation on macOS, cross-compiling
(`deno compile --target` downloads a runtime).

### Embedding Deno in Rust (fact from crates.io and GitHub, 2026-11-21)

| Item                          | State                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deno_core`                   | crates.io 0.413.0, 2026-10-21, MIT; `repository` now `https://github.com/denoland/deno`                                                                                                     |
| `denoland/deno_core` (GitHub) | **archived**; README: "This repository has been merged into denoland/deno"; last push 2026-02-27 (I could not read the archive date; the brief said April)                                  |
| Where the code is now         | `libs/core` in `denoland/deno` (with `libs/serde_v8`, `libs/ops`, ...), examples in `libs/core/examples` (`hello_world.rs`, `eval_js_value.rs`, `op2.rs`, `ts_module_loader.rs`, `wasm.js`) |
| `deno_runtime`                | 0.268.0, 2026-10-21, MIT; `runtime/` in `denoland/deno`; releases every 3 to 5 weeks (0.266 on 08-27, 0.267 on 09-16)                                                                       |
| `v8` (rusty_v8)               | 152.2.0, 2026-08-20, MIT; its own repo is active (pushed 2026-11-21)                                                                                                                        |
| API stability                 | `deno_runtime` README: "the API of this crate is subject to rapid and breaking changes"; `deno_core` README: "Documentation for this crate is thin"                                         |

What embedding looks like now (deduction from the READMEs and sources, not built): depend on
`deno_runtime` (everything: `Deno.*` ops, permissions, `node:` polyfills through extensions) or on
`deno_core` alone (V8 and an event loop, you write the ops). `deno_runtime::MainWorker` is a `JsRuntime`
with the `Deno` namespace, `WebWorker` backs `Worker`. Per-tool isolates with a heap limit and
`terminate_execution` from Rust would remove the problems of section 2b and 3 (hypothesis: V8 offers
`terminate_execution` and a near-heap-limit callback; I did not check that `rusty_v8` and `deno_runtime`
expose them for a worker). The costs are a long first build and a V8 static library to download, a pin to a
monthly-breaking API, and the whole Node compatibility layer to carry, which is exactly what we get for free
with the sidecar. **Not built, not measured: build time, binary size, per-isolate memory.**

### Embedding Bun (fact)

None. `oven-sh/bun#12017` ("Embedding Bun within other native applications (like a Rust program)") is open
with 31 comments. `oven-sh/bun#39362` ("Add an embed API and a libbun shared library target (macOS)", a
draft, macOS only, one run per process) was opened and closed on 2026-08-16 **without being merged**. Bun
can only be a sidecar or a compiled executable.

### Licences (fact: `LICENSE.md` of each repository, crates.io)

- Deno: MIT. `deno_core`, `deno_runtime`, `v8` crates: MIT. V8 itself is BSD-3-Clause (not read here).
- Bun: MIT, **plus JavaScriptCore (and parts of WebKit) statically linked under LGPL-2**, with a statement
  that a user must be able to relink (the build instructions are in Bun's `LICENSE.md`). BoringSSL
  (several), `lol-html` (BSD-3-Clause), `lsquic` and others are listed there too. Shipping Bun inside
  `anvil` means shipping those notices and, under the LGPL-2 reading Bun itself gives, the means to relink;
  have a lawyer read it before we redistribute (not legal advice).

## 5. Serverless features, and what maps onto our contracts

Tested means a run on this machine (`feat-deno.js`, `feat-bun.js`, `unix.js`).

| Feature       | Deno 2.9.8                                                                                                                                           | Bun 1.4.4                                                                                                                                                                                                                | Maps onto     | Verdict                                                                                                                                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQLite        | `node:sqlite` (3.54.1), foreign keys on by default; no native sqlite module                                                                          | `bun:sqlite` and `node:sqlite` (3.54.0)                                                                                                                                                                                  | `database`    | both fine; WAL and `busy_timeout` work in the adapter                                                                                                                                                                                                                            |
| KV            | `Deno.openKv(path)` with `--unstable-kv`: `set` with `expireIn`, `get`, `atomic().check().commit()` (conflict detected), SQLite file locally. Tested | none built in; use a SQLite table                                                                                                                                                                                        | `kv`          | a SQLite table is 25 lines and Workers-shaped; Deno KV has a different API (keys are arrays), useful only if we want its atomics and queues                                                                                                                                      |
| Queue         | `kv.enqueue(msg, { delay })` and `kv.listenQueue(handler)`: delivered in the test after 10 ms                                                        | none                                                                                                                                                                                                                     | `queue`       | at-least-once with backoff, but it lives inside a running process: **does not work with scale to zero** unless the supervisor wakes the tool; Workers Queues' `send`/`queue(batch)` shape is not Deno's                                                                          |
| Cron          | `Deno.cron(name, schedule, handler)` with `--unstable-cron`: registers in a running process. Registration tested, firing not waited for              | `Bun.cron(path, schedule, title)` (arity 3, `.parse`, `.remove`) and a `--cron-title/--cron-period` execution mode: looks like OS-level registration (crontab/launchd). Not run: it would change the system's schedulers | `schedule`    | neither fits scale to zero: **the supervisor owns the clock** and calls `scheduled()` (as the spike's `POST /__scheduled` does); no need for engine cron                                                                                                                         |
| Blob          | filesystem (`node:fs`), `Deno.writeFile`                                                                                                             | `Bun.file`, `Bun.write`, `Bun.S3Client` / `Bun.s3` (S3-compatible: MinIO, R2)                                                                                                                                            | `blob`        | a directory per tool works; `Bun.S3Client` is attractive when the customer already has S3, but R2 has the same S3 API, so the Rust side can do that for both engines                                                                                                             |
| HTTP          | `Deno.serve`, `--parallel`                                                                                                                           | `Bun.serve` with `routes`, `unix` socket                                                                                                                                                                                 | all           | both serve on a Unix socket (tested)                                                                                                                                                                                                                                             |
| WebSocket     | `Deno.upgradeWebSocket`                                                                                                                              | `server.upgrade` + `websocket` handlers                                                                                                                                                                                  | `realtime`    | in Forgeron, tools do not hold sockets: `docs/sdk.md` says realtime is published by the action (the real bundle returns it in the `x-forgeron-realtime` header), so the hub is the platform's, not the tool's. The `WebSocketPair` shim is only for bundles that use it directly |
| Redis         | none built in                                                                                                                                        | `Bun.redis`, `Bun.RedisClient`                                                                                                                                                                                           |               | not needed                                                                                                                                                                                                                                                                       |
| SQL           | `npm:` drivers                                                                                                                                       | `Bun.sql` (Postgres/MySQL/SQLite)                                                                                                                                                                                        | `database`    | our contract is D1-shaped, so we do not want a second API                                                                                                                                                                                                                        |
| OpenTelemetry | `Deno.telemetry` exists; `OTEL_DENO=true` exports traces, metrics, logs (documented; export not run here)                                            | no native equivalent found (surface not exhaustively checked)                                                                                                                                                            | observability | a plus for Deno                                                                                                                                                                                                                                                                  |
| Workflows     | none                                                                                                                                                 | none                                                                                                                                                                                                                     | `workflow`    | **no help from either**: Anvil needs its own durable execution on SQLite                                                                                                                                                                                                         |

## 6. Fidelity risk

### What differs from real Workers, from what was run (fact) and what is known (labelled)

| Area                                                | Difference                                                                                                                                                                                             | Direction                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| D1                                                  | binding of booleans, `undefined`, `Date`, bigint; foreign keys default; integer above 2^53; error messages and codes (`D1_ERROR` vs SQLite's); `meta` fields; blob representation (table in section 1) | adapter owns it                            |
| Cache API                                           | `caches.default` absent (Deno) or `caches` absent (Bun)                                                                                                                                                | adapter                                    |
| HTMLRewriter                                        | absent on Deno                                                                                                                                                                                         | adapter or library                         |
| `crypto.subtle`                                     | no `timingSafeEqual`, no `DigestStream`; Ed25519 present                                                                                                                                               | adapter or library                         |
| `request.cf`, `cf-*` headers, `navigator.userAgent` | absent / different                                                                                                                                                                                     | adapter                                    |
| `nodejs_compat`                                     | a superset locally: a bundle can use `node:child_process` or `node:fs` and pass locally and fail on Cloudflare                                                                                         | catch at build time                        |
| Global scope                                        | in Workers, no I/O and no timers outside a request handler; here the global scope is unrestricted (deduction from the Workers documentation, not run on Cloudflare)                                    | catch at build time                        |
| Time                                                | Workers advances `Date.now()` only on I/O (documented; here it advances in a CPU loop, tested on both engines)                                                                                         | cosmetic                                   |
| Limits                                              | 128 MB memory, CPU time, 50/1000 subrequests, body sizes, cron granularity: none enforced here beyond what the supervisor adds                                                                         | supervisor                                 |
| Uncaught error                                      | Cloudflare returns its own error page and status; the adapter returns 500                                                                                                                              | adapter                                    |
| `fetch`                                             | here a tool can call `localhost` and private addresses; Workers cannot                                                                                                                                 | **security**: deny with permissions (Deno) |
| Engine bugs                                         | V8 (both Deno and workerd) against JavaScriptCore (Bun): regexp, `Intl`, date parsing, `Error.stack` format, microtask order edge cases. Bun is the more distant from workerd                          | engine                                     |

### How often will it differ (hypothesis, labelled as such)

For a tool written against the Forgeron SDK, the drift is mostly in the adapter and not in the engine:
the one real bundle I ran gave identical answers on both engines and went through 6 requests with no change.
**Hypothesis**: for tools that only use D1 (through Kysely), actions, the MCP route and views, fewer than 1
in 20 will show a behavioural difference (unusual SQL typing, a binding that D1 rejects, a regexp or `Intl`
corner), and most of those on the D1 boundary where the adapter can be corrected once for everybody. For
tools that use `caches`, `HTMLRewriter`, `crypto.subtle` extensions or Workers-only globals the rate is
higher until the adapter covers them. I do not have the data for a better number, and I would not give one
before the suite below has run.

### How to catch it: a conformance suite

1. **One suite of request scripts** (HTTP in, HTTP out, plus the state afterwards) written once in
   TypeScript, run against (a) real Cloudflare Workers with a throwaway D1/KV/R2, (b) `wrangler dev`/workerd
   locally, (c) Anvil on Deno, (d) Anvil on Bun. Golden files come from (a); (b), (c), (d) must match.
2. **Cover each binding with edge cases**, starting with the table in section 1: D1 binding types and errors,
   `batch` atomicity, `first(col)`, `raw()`, blob round-trip, KV TTL, `list` pagination and ordering,
   R2 `head`/`list` with prefixes and cursors, `waitUntil` after the response, `scheduled`, a 101 upgrade,
   `crypto.subtle` vectors, `HTMLRewriter`, `caches`, header casing and `set-cookie`, status 204/304 body
   rules, large bodies and streaming.
3. **A bundle linter at build time**: reject `node:` modules that Workers does not provide, top-level I/O
   and Workers-incompatible globals, so a tool cannot pass locally and fail on Cloudflare. The compiler
   already builds the bundle (`apps/cli`), so it is the place.
4. **Run the existing tool tests and the three templates against Anvil in CI**: `templates/*` and
   `apps/cli/fixtures/*` already produce `worker.js`; the spike used one of them as is.
5. **Property tests on the D1 adapter** against SQLite directly, plus the Cloudflare run for the rules
   (a), so that each rule has a source.

## Limits

- One machine (Apple M4, macOS), not a Linux server. Linux numbers differ (page cache, no `footprint`,
  different process start); the sandbox options for Bun on Linux were not exercised.
- Load average 3 to 4 throughout: medians are stable (the spread is given), single runs under load are noisy
  (a first Deno run at 44 ms, then 27 ms).
- Tools are copies of one bundle; real tools differ in the code they load and the memory they keep.
- The harness client is Node, the adapter is 160 lines and has no auth or limits: the latency numbers are a
  floor, not a service level.

## Not tested

- Real D1, KV, R2 behaviour: no Cloudflare account was used. Every "D1 decides" row is unverified.
- `npm:htmlrewriter` (WASM `lol-html`) on Deno: not run; pulling a remote npm package at run time was refused
  by the environment's safety check and I did not work around it. Not claimed to work.
- Embedding `deno_runtime` or `deno_core` in Rust: not built; claims about per-isolate limits are hypotheses.
- Linux: sandboxing Bun (cgroups, Landlock, seccomp, namespaces), `ulimit`/`setrlimit` on either engine.
- Firing of `Deno.cron` and `Bun.cron`; Deno OpenTelemetry export; queue retries and dead letters.
- Durable Objects, Workflows, service bindings, Hyperdrive, Workers AI, Browser Rendering.
- Long-running stability (days), file-descriptor and thread counts at 300 tools, many tools on one SQLite.
- The cost of the supervisor to engine hop in Rust, and a Rust supervisor at all.
- `deno compile` / `bun build --compile` on Linux, signing, cross-targets.
- The Deno worker-terminate CPU behaviour was measured with `top` on a synchronous `for(;;){}`; the cause
  (why `terminate()` does not interrupt it) was not investigated.
- Whether `Deno.openKv` and Bun's `S3Client` would be better backing stores than SQLite and the filesystem.

## Verdict and ranking

For Anvil's requirements (idle costs almost nothing, starts in milliseconds, tools isolated from each other,
a single customer node with tens to hundreds of tools):

| Rank | Option                                                            | Why                                                                                                                                                                                                                                                                                                       | Against                                                                                                                                                                                                                                                  |
| ---- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **Deno, process per tool, strict flags**                          | Isolation is real and demonstrated (files, env, net, run), a heap cap aborts one tool only, `SIGKILL` stops a spin, eviction returns every byte, start 27-35 ms (22 compiled), idle 19-28 MB footprint, OpenTelemetry built in, `deno compile` 65 MB, MIT. The adapter ran a production bundle unchanged. | 2x Bun's memory and 1.5-2x its start; needs `--unstable-*` flags only for KV, cron, worker options (none needed for this model); `HTMLRewriter` missing                                                                                                  |
| 2    | **Bun, process per tool, with an OS sandbox from the supervisor** | Fastest (14-26 ms, 12 compiled) and smallest (9-16 MB footprint), `HTMLRewriter` built in (the same engine as Workers), `node:sqlite` and S3 client, S3-compatible blobs.                                                                                                                                 | No sandbox and no memory cap (demonstrated): isolation must be built by Anvil on Linux and was not tested; foreign keys off by default; no `caches`; a different JS engine from workerd and Deno (JavaScriptCore) = more fidelity risk; LGPL-2 linked in |
| 3    | **Deno workers**                                                  | Half the memory of a process, 18-23 ms, per-worker permissions work, no extra port needed. Acceptable for `anvil dev` where the tools are the developer's.                                                                                                                                                | `terminate()` does not stop a spinning worker; a heap OOM kills all tools; memory is not returned after terminate (530 MB kept after 50); permissions need an unstable flag; no memory cap with permissions                                              |
| 4    | **Bun workers**                                                   | Lightest (4-7 MB per worker, 7-14 ms), `terminate()` works.                                                                                                                                                                                                                                               | No permissions, no memory cap, one OOM takes every tool, RSS grows over churn. Fine for a throwaway dev server, not for `anvil serve`                                                                                                                    |

Recommendation: build Anvil's first engine layer as **Deno, one process per tool**, behind an adapter that
is engine-neutral TypeScript (about 400-600 lines) so that Bun stays a drop-in for trusted first-party tools
or for dev. Evict idle tools with `SIGTERM` after a timeout and restart on the next request; own cron, queue
delivery and realtime in the Rust supervisor, not in the engine; use Unix sockets. Before committing for
good, run two small follow-ups: (1) a spike that builds `deno_runtime` in Rust and measures per-isolate
memory, start and `terminate_execution`, because it is the only route to the isolation of the process model
at the memory of the worker model; (2) the first version of the conformance suite against real D1, because
it decides how large the adapter's rules are.
