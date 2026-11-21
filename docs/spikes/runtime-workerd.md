# Spike: can Anvil run tool bundles by supervising the open-source `workerd`?

Runtime "Anvil" (one Rust binary: `anvil dev`, `anvil serve`). Written 2026-11-21.
Hands-on: everything below marked **measured** or **observed** was run on the machine described under
"Machine". Nothing was deployed, no Cloudflare account and no real secret was used. Scratch code, configs
and logs are kept in
`/private/tmp/claude-501/-Users-elydelva-Developer-Profesional-Forgeron/929788a3-1569-42b4-ad40-818ade77883e/scratchpad/spike-workerd`
(called `$SPIKE` below). It is a scratch directory: a reboot may clear it.

Labels: **measured** (a number from a run), **observed** (a behaviour seen in a run), **read** (from the
binary's help, its `workerd.capnp` schema, the JavaScript bundled in the binary, or the upstream README),
**deduction** (follows from the above, not run), **not verified**.

## Verdict

1. **The design works, and costs less than the brief assumed: workerd already ships most of our resource
   contracts.** This version (`workerd 2026-11-21`, npm `1.20261121.1`) runs D1 (SQLite), KV, Queues, R2,
   cron triggers, Workflows and SQLite Durable Objects with alarms and WebSocket hibernation, persisted to a
   local directory, **without Miniflare** (observed for D1, KV, Queues, cron, alarms, hibernation; R2 and
   Workflows read only). All of it is behind `--experimental`.
2. **Host services are cheap and fast, and need not invent an API.** A 120-line Rust host (tiny_http +
   rusqlite) that speaks **D1's own HTTP protocol** gives tool code the real `env.DB.prepare().bind().first()`
   API through workerd's built-in D1 client (`wrapped` binding on `cloudflare-internal:d1-api`), with
   `batch()` rollback, `raw()` and D1-style errors (observed). Per query, the host costs **about 70–80 µs
   over a no-op request**, workerd's built-in D1 about 100–110 µs, and a SQLite Durable Object called by RPC
   about 30 µs (measured, p50).
3. **Startup and memory are fine for `anvil dev`:** 14 ms from spawn to first response (median of 10), 33 MB
   idle. A real 1.6 MB bundle (the gateway's) costs about 45–50 ms of startup and 3–10 MB once warm, but all
   workers in a config are compiled before the socket listens (50 real bundles: 2.5 s to first response).
4. **The blocker for `anvil serve` with several tools in one process is isolation, not features:**
   - one worker's infinite loop **freezes every worker in the process**, and the process then ignores
     SIGTERM (observed; SIGKILL needed). There is no CPU limit in the open-source build: the Worker Loader
     accepts `limits: { cpuMs }` and does not enforce it (observed: a loop at `cpuMs: 50` ran for > 10 s);
   - one worker's runaway allocation **kills the whole process** with a V8 "Reached heap limit" fatal error
     (observed); there is no per-isolate memory limit;
   - the binary says so itself: "workerd is not a hardened sandbox; run untrusted code in a VM."
     So the supervisor needs a liveness probe and a SIGKILL watchdog in every mode, and `anvil serve` should
     group tools into processes by trust (one process per tool, or per workspace) rather than one process for
     everything (deduction; per-process cost about 33 MB base).
5. **Configuration is static.** Changing the set of services needs a restart (SIGHUP kills the process), or
   `--watch`, which reloads the whole process in about 480 ms (measured, including its debounce). Loading
   tools at runtime works with the **Worker Loader** binding (observed, `--experimental` only): 30 ms for the
   first call of a 1.6 MB bundle, 0.8 ms after; nothing was evicted in 70 s idle (960 MB RSS for 50 bundles).
6. **Recommendation:** go on with "Anvil supervises workerd", with the built-in D1/KV/Queues/R2/cron and
   Durable Objects as the default implementation of our contracts in `anvil dev`, and Rust host services only
   for what must live outside workerd (platform data, secrets, backups, admin queries). Treat
   `--experimental` and the daily release train as the main risk: pin one workerd version per Anvil release
   and test against it. Effort estimate below.

## Question

From the brief: Forgeron tools are TypeScript bundles in the Workers shape
(`export default { fetch(req, env, ctx) }`) that run on Cloudflare with D1, KV and R2. Anvil should run the
same bundles without Cloudflare, by supervising `workerd` as a child process, generating its configuration,
and providing our resource contracts (database = SQLite, kv, blob, queue) from host services reached
through bindings. Find out by doing it:

1. start, startup time, memory with 1, 10 and 50 workers, binary size and version;
2. bindings to a host service (external over Unix socket or TCP; a wrapped binding), round-trip latency,
   compared with workerd's own SQLite;
3. what workerd gives natively without Miniflare;
4. operational facts: platforms, libc floor, release cadence, config changes, crash and loop behaviour,
   limits, the README on security;
5. effort and risk.

## Machine

| Item       | Value                                                                    |
| ---------- | ------------------------------------------------------------------------ |
| CPU        | Apple M4 (arm64)                                                         |
| Memory     | 16 GB                                                                    |
| OS         | macOS 27.2 (build 26B123)                                                |
| workerd    | npm `workerd@1.20261121.1`, binary `@cloudflare/workerd-darwin-arm64`    |
| Node / Bun | Node 24.21.0, Bun 1.4.3 (via `~/.proto/shims`)                           |
| Rust       | rustc / cargo 1.93.0 (Homebrew); host built with `cargo build --release` |

RSS read with `ps -o rss=`. On macOS RSS moves with GC and memory compression; read the memory numbers as
orders of magnitude, not to the megabyte. Latency was measured on loopback with one client connection;
nothing here measures concurrency.

## Setup

```sh
export PATH=~/.proto/shims:$PATH
mkdir -p $SPIKE && cd $SPIKE && npm init -y && npm install workerd@latest
# npm blocks the package's postinstall; the binary comes from the optional dependency anyway:
node_modules/.bin/workerd --version      # workerd 2026-11-21
```

| Fact (read / measured)    | Value                                                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version                   | `workerd 2026-11-21` (the newest compatibility date it supports); npm `1.20261121.1`                                                                                                                                      |
| Binary size               | 145.6 MB (darwin-arm64), 155.9 MB (linux-64, from `npm pack @cloudflare/workerd-linux-64`)                                                                                                                                |
| Dynamic libraries (macOS) | system only (`libc++`, `libSystem`, CoreFoundation, Security…): one self-contained file                                                                                                                                   |
| Config formats            | Cap'n Proto text (`.capnp`), or a `wrangler.json`/`wrangler.jsonc` subset (`workerd serve wrangler.json`)                                                                                                                 |
| `wrangler.json` fields    | `name, main, compatibility_date, compatibility_flags, vars, durable_objects, exports, migrations, no_bundle`; with `--experimental`: `kv_namespaces, queues, triggers, workflows, d1_databases, assets`. No `r2_buckets`. |
| Other commands            | `test`, `bench`, `compile` (a self-contained binary with the config inside), `deploy` (cluster, experimental)                                                                                                             |
| Supervisor-friendly flags | `--socket-fd name=fd` (inherited sockets), `--control-fd` (writes each socket's port as JSON), `-i` inspector, `--watch`                                                                                                  |

The help text also advertises an experimental **cluster** mode (instances sharing an S3/GCS bucket, each
Durable Object on one machine). Not tried; out of scope for single-node `anvil serve`.

## 1. Startup and memory

### One worker, two config formats

`$SPIKE/e1-hello/index.js`:

```js
export default { fetch: (req, env) => new Response("hello " + (env.NAME ?? "")) };
```

`wrangler.json`:

```json
{
  "name": "hello",
  "main": "index.js",
  "compatibility_date": "2026-11-01",
  "no_bundle": true,
  "vars": { "NAME": "json" }
}
```

`hello.capnp`:

```capnp
using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (
  services = [ (name = "hello", worker = .helloWorker) ],
  sockets = [ (name = "http", address = "127.0.0.1:8788", http = (), service = "hello") ],
);
const helloWorker :Workerd.Worker = (
  modules = [ (name = "index.js", esModule = embed "index.js") ],
  compatibilityDate = "2026-11-01",
  bindings = [ (name = "NAME", text = "capnp") ],
);
```

```sh
node bench-startup.mjs 10 e1-hello http://127.0.0.1:8788/ -- serve hello.capnp
node bench-startup.mjs 10 e1-hello http://127.0.0.1:8787/ -- serve wrangler.json -s http=127.0.0.1:8787
```

`bench-startup.mjs` spawns the binary, polls the URL every millisecond until a 200, kills the process, ten
times; it reads RSS 2 s after the last first response.

| Config          | Spawn → first 200, median (min–max) of 10 | Idle RSS |
| --------------- | ----------------------------------------- | -------- |
| `.capnp`        | **14.3 ms** (13.2–37.0)                   | 33.0 MB  |
| `wrangler.json` | 15.2 ms (12.6–28.7)                       | 32.1 MB  |

### 1, 10 and 50 workers in one process

`gen-multi.mjs` writes N distinct workers, either one socket each (`sockets`) or one socket and a
dispatcher worker with N service bindings routing on the first path segment (`dispatch`):

```js
// dispatch.js
export default {
  fetch(req, env) {
    const name = new URL(req.url).pathname.split("/")[1];
    const t = env[name];
    return t ? t.fetch(req) : new Response("no such tool", { status: 404 });
  },
};
```

Three bundle sizes: `tiny` (a three-line worker), `big` (a synthetic 1 MB module with 9,000 exported
functions, a pessimistic case), and `real`: N copies of the repository's own built gateway bundle
(`apps/gateway/dist/worker.js`, 1.6 MB, copied into `$SPIKE/fixtures`, a trailing comment making each copy
distinct). The gateway answers 500 without its bindings, which is enough to load and run it. `bench-multi.mjs`
measures spawn → first response, RSS after 1.5 s idle, then RSS after one request to every worker.

| Bundle | Mode     | N   | Spawn → first response | RSS idle | RSS after 1 request each |
| ------ | -------- | --- | ---------------------- | -------- | ------------------------ |
| tiny   | sockets  | 1   | 140 ms¹                | 33 MB    | 33 MB                    |
| tiny   | sockets  | 10  | 40 ms                  | 53 MB    | 53 MB                    |
| tiny   | sockets  | 50  | 134 ms                 | 139 MB   | 141 MB                   |
| tiny   | dispatch | 1   | 37 ms                  | 36 MB    | 37 MB                    |
| tiny   | dispatch | 10  | 46 ms                  | 56 MB    | 56 MB                    |
| tiny   | dispatch | 50  | 130 ms                 | 143 MB   | 144 MB                   |
| real   | sockets  | 1   | 69 ms                  | 67 MB    | 44 MB                    |
| real   | sockets  | 10  | 461 ms                 | 222 MB   | 127 MB                   |
| real   | sockets  | 50  | 2,544 ms               | 524 MB   | 181 MB                   |
| big    | sockets  | 50  | 6,089 ms               | 701 MB   | 662 MB                   |
| big    | dispatch | 50  | 5,549 ms               | 899 MB   | 770 MB                   |

¹ First run of the series, cold disk cache; the 10-run median above is 14 ms.

Findings:

- **About 2 MB per tiny worker, 3–10 MB per real 1.6 MB bundle once warm** (measured; the drop from idle to
  "after one request" is GC of compilation garbage, not eviction).
- **Startup is linear in the number and size of workers, because every worker is compiled before the
  sockets listen** (observed: 50 real bundles, 2.5 s before the first response; no lazy loading of
  statically configured workers). For `anvil dev` with a handful of tools this is invisible; for
  `anvil serve` with 50 tools, a restart is a few seconds of downtime.
- Sockets vs dispatcher makes no difference in memory or startup (measured). A dispatcher adds one
  in-process hop (not measured separately; part of the 0.8 ms warm call in §3).

## 2. Bindings to a host service

### The host

`$SPIKE/host-rs` (`cargo build --release`, 2.6 MB binary): tiny_http `=0.12.0`, rusqlite `=0.32.1`
(bundled SQLite), serde_json. One SQLite file in WAL mode, one thread, `prepare_cached`. It listens on a
Unix socket (`unix:/tmp/anvil-spike-host.sock`) or TCP (`127.0.0.1:7801`) and serves:

- `POST /anvil/query {sql, params}` and `/anvil/batch [...]` — our own minimal protocol;
- `POST /query` and `/execute` — **D1's HTTP protocol** as read in the D1 worker bundled in the binary
  (`/workerd/d1.js`): a statement or an array of them, run in one transaction, answered
  `[{success, results, meta}]`, `?resultsFormat=ROWS_AND_COLUMNS` for `raw()`, `{success:false, error}` on
  failure.

### The worker side

`$SPIKE/e2-bindings/config.capnp`:

```capnp
using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (name = "tool", worker = .tool),
    (name = "host", external = (address = "unix:/tmp/anvil-spike-host.sock", http = ())),
    (name = "hosttcp", external = (address = "127.0.0.1:7801", http = ())),
    (name = "d1", worker = .d1),
    (name = "state", disk = (path = "state", writable = true)),
  ],
  sockets = [ (name = "http", address = "127.0.0.1:8800", http = (), service = "tool") ],
  extensions = [ (modules = [ (name = "anvil:db", esModule = embed "anvil-db.js", internal = true) ]) ],
);

const tool :Workerd.Worker = (
  modules = [ (name = "tool.js", esModule = embed "tool.js") ],
  compatibilityDate = "2026-11-01",
  bindings = [
    (name = "HOST", service = "host"),                       # raw fetch over the Unix socket
    (name = "HOSTTCP", service = "hosttcp"),                 # raw fetch over TCP
    (name = "DB", wrapped = (moduleName = "cloudflare-internal:d1-api",     # workerd's D1 client → our host
                             innerBindings = [(name = "fetcher", service = "host")])),
    (name = "ADB", wrapped = (moduleName = "anvil:db",                     # our own wrapper module
                              innerBindings = [(name = "host", service = "host")])),
    (name = "BUILTIN", wrapped = (moduleName = "cloudflare-internal:d1-api", # workerd's built-in D1
                                  innerBindings = [(name = "fetcher", service = (name = "d1", props = (json = "{\"database\": \"spike\"}")))])),
    (name = "STORE", durableObjectNamespace = "Store"),      # the tool's own SQLite Durable Object
  ],
  durableObjectNamespaces = [ (className = "Store", uniqueKey = "anvil-spike-store", enableSql = true) ],
  durableObjectStorage = (localDisk = "state"),
);

const d1 :Workerd.Worker = (
  modules = [ (name = "d1.js", bundled = "/workerd/d1.js") ],
  compatibilityDate = "2026-11-01",
  bindings = [ (name = "DATABASE", durableObjectNamespace = "D1Database") ],
  durableObjectNamespaces = [ (className = "D1Database", uniqueKey = "anvil-spike-d1", enableSql = true) ],
  durableObjectStorage = (localDisk = "state"),
);
```

The custom wrapper, `anvil-db.js` (an extension module marked `internal`, so tool code cannot import it; the
`wrapped` binding calls its default export with the inner bindings):

```js
class Statement {
  constructor(host, sql, params = []) {
    this.host = host;
    this.sql = sql;
    this.params = params;
  }
  bind(...params) {
    return new Statement(this.host, this.sql, params);
  }
  async #call() {
    const r = await this.host.fetch("http://anvil/anvil/query", {
      method: "POST",
      body: JSON.stringify({ sql: this.sql, params: this.params }),
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error);
    return j;
  }
  async all() {
    const j = await this.#call();
    return { success: true, results: j.results, meta: j.meta };
  }
  async first(col) {
    const { results } = await this.all();
    const row = results[0] ?? null;
    return col && row ? row[col] : row;
  }
  async run() {
    return this.all();
  }
}
class AnvilDatabase {
  #host;
  constructor(host) {
    this.#host = host;
  }
  prepare(sql) {
    return new Statement(this.#host, sql);
  }
  async batch(stmts) {
    /* POST /anvil/batch */
  }
}
export default function makeBinding(env) {
  return new AnvilDatabase(env.host);
}
```

Run:

```sh
host-rs/target/release/anvil-host-spike unix:/tmp/anvil-spike-host.sock host.sqlite &
host-rs/target/release/anvil-host-spike 127.0.0.1:7801 host.sqlite &
node_modules/.bin/workerd serve --experimental e2-bindings/config.capnp &
for m in noop fetch "fetch&sock=HOSTTCP" d1host anvil d1builtin dorpc; do node bench-client.mjs http://127.0.0.1:8800 "$m" 1000; done
```

Each request to `/one?mode=…` runs exactly one `SELECT v FROM t WHERE id = ?` (100-row table) through the
chosen path and returns the value, checked by the client. `bench-client.mjs` sends 100 warm-up requests,
then 1,000 sequential requests on one keep-alive connection, timed with `process.hrtime`. `noop` returns
without a query: the HTTP floor to subtract.

**Why from the client:** inside a worker, `performance.now()` advances only on I/O and in whole
milliseconds (observed: every per-query sample was 0, 1 or 3 ms; the `precise_timers` compatibility flag
changed nothing). In-worker loop totals are given as a cross-check.

| Path (tool code sees…)                                     | p50, run 1 / 2   | p99, run 1 / 2   | p50 minus noop | In-worker mean, 3 runs |
| ---------------------------------------------------------- | ---------------- | ---------------- | -------------- | ---------------------- |
| `noop` (no query)                                          | 0.093 / 0.082 ms | 0.380 / 0.124 ms | —              | —                      |
| `env.HOST.fetch()` → Rust host, Unix socket                | 0.156 / 0.161 ms | 0.245 / 0.285 ms | ~70 µs         | 0.057–0.075 ms         |
| `env.HOSTTCP.fetch()` → Rust host, TCP loopback            | 0.166 / 0.171 ms | 0.243 / 0.332 ms | ~80 µs         | 0.072–0.120 ms         |
| `env.DB.prepare()` (workerd's D1 client → Rust host, Unix) | 0.174 / 0.163 ms | 0.249 / 0.235 ms | ~80 µs         | 0.070–0.186 ms         |
| `env.ADB.prepare()` (our wrapper → Rust host, Unix)        | 0.155 / 0.161 ms | 0.378 / 0.226 ms | ~70 µs         | 0.063–0.072 ms         |
| `env.BUILTIN.prepare()` (workerd's built-in D1, SQLite DO) | 0.195 / 0.192 ms | 0.346 / 0.318 ms | ~110 µs        | 0.093–0.132 ms         |
| `stub.get()` RPC to the tool's own SQLite Durable Object   | 0.114 / 0.112 ms | 0.196 / 0.184 ms | ~30 µs         | 0.021–0.030 ms         |

Max values were 0.5–5.5 ms in every row, scattered (macOS scheduling, GC); not investigated.

**D1 compatibility through the host** (`GET /compat`, observed, both `DB` and `BUILTIN`): `run()` returns
`meta.changes`/`last_row_id`; `batch([insert, select])` returns both results; a batch whose second statement
fails throws `D1_ERROR: no such column…` and **rolls back** the first (count after = 0); `raw({columnNames:
true})` returns the header row then rows; `first("name")` works; a bad column throws `D1_ERROR: …`. Two
gaps in the spike host, not in the approach: `exec()` with several statements only ran the first (the host
prepares one statement per entry), and `meta` counters other than `changes`/`last_row_id` are zeros.

Findings:

- **External services work over Unix sockets and TCP with no measurable difference** (~10 µs in favour of
  the Unix socket, inside noise).
- **The cost of leaving the process is ~70–80 µs per query; workerd's own D1 is not faster** (~110 µs,
  because it goes worker → D1 worker → Durable Object). Only a tool's own SQLite Durable Object is faster
  (~30 µs), since the SQL runs in-process.
- **A `wrapped` binding is the right shape for "a nice object"**, and two variants work: our own internal
  extension module (any API we want), or **workerd's own `cloudflare-internal:d1-api` pointed at a host that
  speaks D1's HTTP protocol, which gives tools the exact D1 API for free.** The second is the one to keep for
  the `database` contract: no client code to maintain, and tool code is unchanged between Cloudflare and
  Anvil.
- Caveat: the D1 client switches to JS RPC (`query()`) under the `d1_binding_jsrpc` compatibility flag
  (read in the bundled client); an external HTTP host cannot answer RPC. Not tested whether a future
  compatibility date turns that flag on by default; if so, a host would need a thin JS shim worker in front
  of it (deduction).

## 3. What workerd gives natively, without Miniflare

`$SPIKE/e3-native/wrangler.json`, served with
`workerd serve --experimental --verbose wrangler.json -s http=127.0.0.1:8810`:

```json
{
  "name": "native",
  "main": "index.js",
  "compatibility_date": "2026-11-01",
  "no_bundle": true,
  "durable_objects": { "bindings": [{ "name": "ROOM", "class_name": "Room" }] },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["Room"] }],
  "kv_namespaces": [{ "binding": "KV", "id": "kv1" }],
  "queues": {
    "producers": [{ "binding": "Q", "queue": "q1" }],
    "consumers": [{ "queue": "q1", "max_batch_timeout": 1 }]
  },
  "triggers": { "crons": ["* * * * *"] }
}
```

`index.js` has a `Room` Durable Object (`ctx.acceptWebSocket`, `setAlarm`, `alarm()`), and `fetch`,
`queue` and `scheduled` handlers that record what they saw in KV (file in `$SPIKE/e3-native`).

| Feature                                 | Result                                                                                                                                                                                                                | Status             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| D1                                      | `d1_databases` in `wrangler.json` (needs `--experimental`, else refused with a clear message) gives a `D1Database`; data in `.wrangler/state/workerd/d1/D1Database/<hash>.sqlite`                                     | observed           |
| KV                                      | `put`/`get`/`list` with metadata; stored as a SQLite Durable Object (`kv/KVNamespace/…sqlite`), large values in a blob directory                                                                                      | observed           |
| Queues                                  | `send()` → `queue()` handler got a batch of 1 within 3 s; `ackAll()`                                                                                                                                                  | observed           |
| Durable Object alarms                   | `setAlarm(now + 2 s)` fired; state persisted                                                                                                                                                                          | observed           |
| WebSocket hibernation                   | the object was evicted while the socket stayed open and was **constructed again** to deliver a message 25 s later; `getWebSockets()` still 1                                                                          | observed           |
| Persistence across restart              | after kill and restart, KV values, the alarm's `firedAt` and the queue's record were all there                                                                                                                        | observed           |
| Cron triggers                           | fired on the **real wall clock** at the next minute (`scheduled * * * * *`); the schedule is itself a Durable Object (`cron/Schedule/…sqlite`) armed at startup, retries 6 times with back-off                        | observed / read    |
| Firing a cron by hand                   | no HTTP endpoint like Miniflare's `/cdn-cgi/handler/scheduled`. `/workerd/cron.js` has a test clock (`TEST_CLOCK`, `POST /clock?advance=`); a supervisor-owned worker with a service binding could call `scheduled()` | read, not verified |
| R2                                      | `/workerd/r2.js` bundled (an R2 Worker over a `disk` or `bucket` service); not in the `wrangler.json` subset                                                                                                          | read, not verified |
| Workflows, rate limiting, Secrets Store | bundled modules `/workerd/workflows.js`, `/workerd/ratelimit.js`, `/workerd/secrets-store.js`                                                                                                                         | read, not verified |
| Static assets                           | `assets` service (`_headers`, `_redirects`, `run_worker_first`) — what the gateway uses for the console                                                                                                               | read, not verified |
| Dynamic loading (Worker Loader)         | works, see below                                                                                                                                                                                                      | observed           |
| Hot reload (`--watch`)                  | works for code and config, whole process, ~480 ms; see §4                                                                                                                                                             | measured           |
| Structured logs                         | `logging = (structuredLogging = true)` → JSON lines `{timestamp, level, message}`; **the line does not name the worker**                                                                                              | observed           |
| Tail workers                            | `tails = ["tail"]` delivered each request's outcome, logs and URL to a tail worker; `scriptName` was `null` (capnp services have no script name)                                                                      | observed           |
| Inspector                               | `-i 127.0.0.1:9230` → `/json/list` lists one DevTools target per worker                                                                                                                                               | observed           |

Note on the brief's question "are the simulators in workerd or only in Miniflare's JS?": in this version
they are **in workerd**, as JavaScript workers compiled into the binary (`bundled = "/workerd/kv.js"` etc.),
each documented in its header as "an interface: cli/wrangler.rs and hand-written configs write it". The
`wrangler.json` mode writes those configs for us; a hand-written capnp config can use them too (done above
for D1).

### Worker Loader (dynamic loading without restart)

`$SPIKE/e4-loader/config.capnp`:

```capnp
using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (
  services = [
    (name = "loader", worker = (
      modules = [(name = "loader.js", esModule = embed "loader.js")],
      compatibilityDate = "2026-11-01",
      bindings = [
        (name = "LOADER", workerLoader = (id = "tools")),
        (name = "HOST", service = "host"),
      ])),
    (name = "host", external = (address = "unix:/tmp/anvil-spike-host.sock", http = ())),
  ],
  sockets = [(name = "http", address = "127.0.0.1:8820", http = (), service = "loader")],
);
```

`loader.js`, the part that matters:

```js
const worker = env.LOADER.get(`${name}@${version}`, () => ({
  compatibilityDate: "2026-11-01",
  mainModule: "index.js",
  modules: { "index.js": source },
  env: { TOOL: name, HOST: env.HOST }, // bindings handed to the tool, here a service stub
  globalOutbound: null, // no internet for the tool
  limits: { cpuMs: 50 },
}));
return worker.getEntrypoint().fetch(req);
```

Observed:

- Without `--experimental`: refused at startup ("Worker loader bindings are an experimental feature…").
  There is no compatibility flag to set; the CLI flag is the gate.
- A tool POSTed at runtime answered in 6 ms the first time, 0.6 ms after; a new version (new name
  `crm@2`) was served at once, with no restart.
- A service stub passed in `env` worked: the loaded tool queried the Rust host through `env.HOST`.
- `globalOutbound: null` blocked `fetch("https://example.com")` ("This worker is not permitted to access
  the internet via global functions like fetch()").
- `limits: { cpuMs: 50 }` was accepted and **not enforced** (see §4).

Measured with 50 copies of the real 1.6 MB gateway bundle (`bench-loader.mjs`):

| Loaded | RSS    |
| ------ | ------ |
| 0      | 31 MB  |
| 1      | 68 MB  |
| 10     | 233 MB |
| 50     | 960 MB |

First call of a newly loaded bundle: median **30.5 ms**; next call 0.8 ms. After 70 s idle, RSS was still
960 MB and the first tool answered in 3.9 ms: no eviction seen in that window (the schema says the loader
"automatically unload[s] Workers that are not in use"; when, not found). Dynamically loaded bundles cost
more memory than the same bundles configured statically (181–524 MB for 50); not investigated.

## 4. Operational facts

| Item               | Fact                                                                                                                                                                                                                                                                                                                                                     | Status          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Platforms          | README: "tested on" Linux and macOS (x86-64 and arm64) and Windows (x86-64); npm ships darwin-arm64, darwin-64, linux-arm64, linux-64, windows-64                                                                                                                                                                                                        | read            |
| libc floor         | README: Linux needs "glibc 2.35 or higher (already included on e.g. Ubuntu 22.04, Debian Bookworm)", macOS 13.5 or higher. The linux-64 binary's highest versioned glibc symbol is `GLIBC_2.27`; the README's 2.35 is the supported floor. No musl build (Alpine needs glibc compat).                                                                    | read / measured |
| CPU                | README: x86-64 with SSE4.2 and CLMUL, or arm64 with CRC                                                                                                                                                                                                                                                                                                  | read            |
| Release cadence    | **a release almost every day**: 591 versions on npm, 27–29 a month since April 2026, the last 15 on 15 consecutive days (Nov 6–21). Version = date                                                                                                                                                                                                       | measured        |
| Compatibility      | README: a worker set to a past compatibility date gets the API "as it existed on that date"                                                                                                                                                                                                                                                              | read            |
| Config changes     | static. `SIGHUP` **killed** the process (observed). `--watch` reloads on any change to code or config: whole process, ~480 ms until the new answer, in place (same PID). In-flight requests and open WebSockets during a reload: not verified                                                                                                            | observed        |
| Bad code on reload | a syntax error after `--watch` reload: the process stays up, logs the error, and answers 500 until the next good change                                                                                                                                                                                                                                  | observed        |
| Infinite loop      | `for (;;) {}` in one worker **froze every worker in the process** (a sibling service on another socket timed out); CPU at 99.8 %; the process **ignored SIGTERM** and needed SIGKILL                                                                                                                                                                     | observed        |
| CPU limits         | none in config for static workers (schema read); Worker Loader's `limits.cpuMs` accepted, not enforced (a loop at 50 ms ran > 10 s and hung the process)                                                                                                                                                                                                 | observed        |
| Memory limits      | no per-isolate limit. One worker allocating until failure brought the **whole process** down: V8 `Mark-Compact … last resort` then `fatal: V8 fatal error; location = Reached heap limit` at about 1.4 GB of heap (RSS 1.49 GB)                                                                                                                          | observed        |
| Ready signal       | `--control-fd` writes each socket's port as JSON (read in help, not used); otherwise poll the socket, as the spike did                                                                                                                                                                                                                                   | read            |
| systemd            | README: "One good way to manage `workerd` in production is using `systemd`", with `--socket-fd` to inherit privileged sockets                                                                                                                                                                                                                            | read            |
| Security           | README: "`workerd` on its own does not contain suitable defense-in-depth against the possibility of implementation bugs." and "When using `workerd` to run possibly-malicious code, you must run it inside an appropriate secure sandbox, such as a virtual machine." `workerd --help`: "workerd is not a hardened sandbox; run untrusted code in a VM." | read            |

The two limit tests, `$SPIKE/e5-limits/config.capnp` (three services, three sockets):

```js
// loop.js
export default { fetch(req) { if (new URL(req.url).pathname === "/loop") { for (;;) {} } return new Response("loop-worker alive"); } };
// mem.js
const keep = [];
export default { fetch(req) { const mb = Number(new URL(req.url).searchParams.get("mb") ?? 10);
  for (let i = 0; i < mb; i++) keep.push(new Array(1024 * 128).fill(i)); return new Response("held ~" + keep.length + " MB"); } };
// hello.js
export default { fetch: () => new Response("hello alive") };
```

```sh
curl -m 3 localhost:8833/        # hello alive
curl -m 2 localhost:8831/loop    # times out
curl -m 3 localhost:8833/        # times out: the whole process is stuck
kill -TERM <pid>                 # still alive 2 s later; kill -9 needed
```

## 5. Assessment

### What the supervisor has to do (deduction, from what was run)

1. **Fetch and pin the binary.** 146–156 MB per platform; too big to embed in the Anvil binary comfortably.
   Download the pinned `@cloudflare/workerd-<platform>` tarball on first run and verify its hash.
2. **Generate the config.** Cap'n Proto text is easy to template (the spike's generators are 30 lines). The
   `wrangler.json` mode is tempting for `anvil dev` (it writes the D1/KV/Queues/cron plumbing), but it only
   accepts its listed fields and one worker per file, so Anvil should generate capnp and reuse the
   `bundled` modules itself (done for D1 above; KV, Queues, R2 and cron follow the same documented
   "interface" headers).
3. **Own sockets and readiness.** Pass sockets with `--socket-fd`, read ports from `--control-fd`.
4. **Watchdog.** A periodic probe per process; on timeout SIGKILL and restart (SIGTERM is not enough when a
   worker spins). Restart also on V8 fatal exit.
5. **Isolation by process.** Group tools into workerd processes by trust boundary. One process per tool costs
   about 33 MB plus the bundle (deduction from the measurements; 50 tools ≈ 2–3 GB instead of 0.2–0.5 GB
   shared). Inside a VM or container if tools are not trusted, per the README.
6. **Install and update tools.** Either regenerate and restart the process that holds the tool (seconds for
   tens of real bundles), or use the Worker Loader (no restart, but experimental, no limits, no eviction
   seen). For `anvil serve` the restart-per-group path is the safe default.
7. **Logs.** Structured logs do not carry the worker name; attribute them with one tail worker per tool or
   one process per tool.
8. **Host services.** Only where data must sit outside workerd. The D1 HTTP protocol host is the model.

### Effort (estimate, not measured)

| Piece                                                                               | Estimate       |
| ----------------------------------------------------------------------------------- | -------------- |
| Binary fetch/pin, config generator, spawn, readiness, watchdog, restart             | 1–2 weeks      |
| `anvil dev` on the built-in D1/KV/Queues/R2/cron + DO, with `--watch`               | 1 week         |
| Rust `database` host speaking D1's protocol, to parity (`exec`, meta, bookmarks)    | 1 week         |
| Other host contracts (kv, blob, queue) on workerd's documented protocols, if needed | 1–2 weeks each |
| `anvil serve`: process groups, tool install/update, systemd unit, logs              | 2–3 weeks      |

### Risks

- **Everything we need is experimental**: `--experimental` for D1/KV/Queues/cron in `wrangler.json`, for the
  Worker Loader, for `bucket`/`assets`/`cache` services; `durableObjectStorage.localDisk` is marked
  "EXPERIMENTAL; SUBJECT TO BACKWARDS-INCOMPATIBLE CHANGE". The bundled modules say their config interface
  only grows, but on-disk layouts could change. Mitigation: pin, upgrade deliberately, back up `state/`.
- **Daily releases**: no LTS. We choose a version and test against it.
- **No CPU or memory isolation within a process**, and the README's own warning on sandboxing.
- **Startup grows with the number of tools** because all are compiled eagerly.
- **The D1 client may move to RPC** (`d1_binding_jsrpc`), which an HTTP host cannot answer without a shim.

### What could not be made to work, or was not tried

- Sub-millisecond timing inside a worker (timers are coarse; `precise_timers` did nothing here).
- A CPU limit of any kind in the open-source build.
- Eviction in the Worker Loader within 70 s.
- Not tried: R2, Workflows, assets, cache, cluster mode, `--socket-fd`/`--control-fd`, `workerd compile`,
  Linux (only the binary was inspected), concurrency and throughput under load, behaviour of in-flight
  requests during `--watch` reloads, Windows.

## Scratch files

All in `$SPIKE`: `bench-startup.mjs`, `gen-multi.mjs`, `gen-real.mjs`, `bench-multi.mjs`,
`bench-client.mjs`, `bench-loader.mjs`, `watch-probe.mjs`; `e1-hello`, `e1-multi` (generated configs),
`e2-bindings` (host benchmark, `anvil-db.js`, `tool.js`), `e2-d1json`, `e3-native`, `e4-loader`,
`e5-limits`, `e6-watch`, `e7-obs` (structured logs, tail, inspector); `host-rs` (the Rust host);
`fixtures/` (a copy of the gateway bundle and a `strings` dump of the binary, where the bundled modules'
headers were read); `linux-pkg/` (the linux-64 package, inspected only).
