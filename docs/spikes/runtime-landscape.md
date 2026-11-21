# Spike: what executes the TypeScript in Anvil

Date: 2026-11-21. Web research plus a few local measurements. Every claim carries a URL; anything I could not verify is marked **[unverified]**. Quotes are under 15 words.

## Why this changed in the last six weeks

The landscape moved on 2026-10-09 and the question is now different from the one we started with.

- Deno's whole team joined Cloudflare. Ryan Dahl and Bert Belder lead "a new effort to make workerd self-hosting a first-class supported way to build and run apps", and will merge "code and ideas from celld back into workerd" ([Cloudflare blog](https://blog.cloudflare.com/deno-joins-cloudflare/)).
- The Deno runtime gets one more year of monthly bug and security releases, then development ends. Deno Deploy shuts down after six months. Deno "will remain open source" ([Deno blog](https://deno.com/blog/cloudflare)).
- celld, released in August 2026 by Dahl, is a Rust daemon that embeds V8 and runs Wrangler bundles with Durable Objects, KV, Queues, D1, R2, Workflows and cron ([celld README](https://github.com/denoland/celld)). It is the nearest existing thing to Anvil.
- Kenton Varda states workerd's gap: Durable Objects exist "only in a single-instance way, good enough for local testing, but unable to scale" ([Cloudflare blog](https://blog.cloudflare.com/deno-joins-cloudflare/)). On one server, that gap does not hurt us.

Cluster work is already landing in workerd itself: PRs by the celld authors for cluster leases, fencing and a shared Cache API backend ([#8631](https://github.com/cloudflare/workerd/pull/8631), [#8637](https://github.com/cloudflare/workerd/pull/8637), [#8508](https://github.com/cloudflare/workerd/pull/8508)), with a `src/workerd/server/cluster` directory ([tree](https://github.com/cloudflare/workerd/tree/main/src/workerd/server/cluster)). Its `--experimental` flag in `workerd serve wrangler.jsonc` already covers KV, R2, cron triggers, queues, workflows, D1 and assets ([workerd README](https://github.com/cloudflare/workerd/blob/main/README.md)).

## Comparison table

Scores: ++ strong, + good, 0 neutral, - weak, -- blocking. Based on the evidence in the sections below.

| Criterion                                         | 1. workerd supervised                                                                 | 2. Deno (process / deno_runtime)                                                         | 3. Bun process per tool                                                                    | 4. Own rusty_v8 embed                                                             | 5a. celld (Rust+V8, Apache-2.0)                                                | 5b. OpenWorkers (Rust+V8)                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| Fidelity to Workers (same bundle on both targets) | ++ same code as production, same `export default`, compat dates                       | - `deno serve` takes `export default { fetch }` but no bindings, DO, queues; shim needed | - same; shim needed                                                                        | + only as good as what we write; Workers API surface is large                     | ++ targets Wrangler bundles, DO, D1, KV, R2, Queues, Workflows                 | 0 no DO, no WebSockets; own binding set           |
| Idle cost and density                             | + one process, many isolates; per-isolate RSS **[unverified]**, not measured          | - process per tool: ~42 MB idle RSS measured locally                                     | - ~27 MB idle RSS measured locally                                                         | ++ isolates in one process; we choose the model                                   | ++ ~4 MB per resident cell, vendor laptop figure                               | + isolate pool; no memory numbers published       |
| Cold start                                        | + isolates start in milliseconds (Cloudflare claim, no number for workerd standalone) | 0 ~28 ms process start to first response measured locally                                | 0 ~36-50 ms measured locally                                                               | ++ snapshots possible; OpenWorkers claims tens of microseconds in its pinned pool | ++ ~4 ms to wake a hibernated cell (vendor figure)                             | ++ same claim as column 4, no methodology         |
| Isolation between tools                           | 0 isolates, but README says "not a hardened sandbox"                                  | + process boundary and Deno permissions                                                  | + process boundary, no permission model                                                    | 0 isolates only; we own the hardening                                             | - "not safe for hostile multi-tenant use"                                      | - author dropped "secure" wording after criticism |
| Effort, tiny team with agents                     | + we write a config generator and a supervisor; we do not build workerd               | 0 shim for bindings plus a runner                                                        | 0 same, plus no sandboxing                                                                 | -- reimplement fetch, streams, crypto, Node compat, DO, cron, queues              | + if usable as is; one fleet = one app means a multi-tool layer to build       | - one maintainer, missing DO                      |
| Ops weight, customer with one server              | + one extra binary, no bucket, local disk state                                       | + one binary                                                                             | + one binary                                                                               | + one binary (ours)                                                               | - needs an S3-compatible bucket with conditional writes, TLS and ingress by us | - platform with API and dashboard                 |
| Licence                                           | Apache-2.0                                                                            | MIT (Deno)                                                                               | MIT plus LGPL for JavaScriptCore                                                           | MIT (rusty_v8)                                                                    | Apache-2.0                                                                     | MIT                                               |
| Bus factor                                        | + 9.2k stars, Cloudflare engineers, release 2026-11-21                                | -- development ends about Oct 2027                                                       | + 96.8k stars, owned by Anthropic (disclosed: the same company as the author of this tool) | 0 rusty_v8 has several maintainers; Cloudflare says it will keep supporting it    | - 2 contributors listed, PRs disabled, being merged into workerd               | -- one main developer                             |

## Evidence per candidate

### 1. Supervise the open-source workerd

**State of the open-source binary**

- Repo: 9,233 stars, Apache-2.0, latest release `v1.20261121.1` on 2026-11-21 ([GitHub API](https://github.com/cloudflare/workerd/releases)). It is the "same code we run in production" ([Cloudflare blog](https://blog.cloudflare.com/deno-joins-cloudflare/)).
- `workerd serve wrangler.jsonc` accepts a limited set of fields. `kv_namespaces`, `r2_buckets`, `triggers.crons`, `queues`, `workflows`, `d1_databases` and `assets` need `--experimental`. Any other field is an error ([README](https://github.com/cloudflare/workerd/blob/main/README.md)).
- Each KV namespace and each D1 database is one Durable Object, so its throughput is that of one object. Rate limits live in memory and reset on restart (same README).
- Worker Loader is in the config schema as a `workerLoader` binding ([workerd.capnp](https://github.com/cloudflare/workerd/blob/main/src/workerd/server/workerd.capnp)). I found no standalone-server documentation or example for it, so its maturity is **[unverified]**.
- The README warns: "`workerd` is not a hardened sandbox". For possibly malicious code it demands "a virtual machine" or similar ([README](https://github.com/cloudflare/workerd/blob/main/README.md)). Our tools are written by the customer's own staff and agents, which makes them semi-trusted. The warning matters for tool-to-tool isolation and for any marketplace code.
- Limits are not enforced. A third-party guide says: "Do not assume that self-hosted workerd applies Cloudflare CPU, memory, or subrequest limits." It also says Durable Object memory storage is lost on stop, disk mode is single-instance, and `waitUntil()` tasks can be lost on a crash ([Flavio Copes](https://flaviocopes.com/workerd/)). For comparison, Cloudflare's own limits are 128 MB per isolate, 30 s default CPU on paid, 1 s startup ([limits](https://developers.cloudflare.com/workers/platform/limits/)). Anvil would have to enforce its own.
- The build is Bazel and C++ with a growing Rust part (recent commits add a Rust JSG layer). We would use prebuilt binaries; the README says they are available via npm ([README](https://github.com/cloudflare/workerd/blob/main/README.md)). Linux needs glibc 2.35 or newer ([Umesh Malik](https://umesh-malik.com/blog/self-host-cloudflare-workers-workerd-celld)).

**Who runs it**

- Cloudflare admits few do: "Most people don't seem to have any idea that this is even possible." ([Cloudflare blog](https://blog.cloudflare.com/deno-joins-cloudflare/)). They also say they "haven't done a good job of building out the related services and tools" ([ITdaily summary](https://itdaily.com/news/business/cloudflare-deno/)).
- WDL is a self-hosted multi-tenant Workers platform on stock, unmodified workerd. It needs Redis/Valkey and S3-compatible storage and runs single-region, Apache-2.0, 60 stars, release `wdl.20261116.1` ([README](https://github.com/wdl-dev/wdl), [GitHub API](https://github.com/wdl-dev/wdl/releases)). It shows that a platform on top of workerd is feasible, built by a small outside team. It is early and says it is "not a full drop-in replacement".
- Miniflare 2 is archived and Miniflare is now a package in `workers-sdk`, version `5.20261119.0-beta`, built on workerd ([workers-sdk](https://github.com/cloudflare/workers-sdk)). Wrangler dev already runs on workerd, so local fidelity is the best of all candidates.

**Real user reports.** I could not read Reddit (the search tool is blocked there), so there are no r/selfhosted or r/CloudFlare threads here. From Hacker News:

- buremba on the OpenWorkers thread: "I tried to run it locally some time ago, but it's buggy as hell when self-hosted." Kenton Varda replied: "I'm curious what bugs you encountered." ([HN 46454693](https://news.ycombinator.com/item?id=46454693)). One anecdote, no bug list.
- Flavio Copes on celld: "would not move an important production system to it today" ([post](https://flaviocopes.com/celld/)). It is about celld, not workerd, but shows how cautious even friendly writers are.

**Verdict.** Highest fidelity and the lowest effort, with three open points: sandboxing (we add OS-level confinement), limit enforcement (we supervise), and the maturity of the `--experimental` Wrangler mode. The single-instance Durable Object limit does not touch a single-server install.

### 2. Deno

- Repo: 109k stars, MIT, v2.9.8 on 2026-10-21 ([GitHub](https://github.com/denoland/deno/releases)). Development ends about a year after 2026-10-09, with monthly fixes until then ([Deno blog](https://deno.com/blog/cloudflare)). A Deno-side commenter wrote: "Deno is over" ([HN 50019911](https://news.ycombinator.com/item?id=50019911)).
- `deno_core` is archived (2026-04-02) and "merged into denoland/deno" ([repo](https://github.com/denoland/deno_core)); it now lives in `libs/core` in the main repo ([tree](https://github.com/denoland/deno/tree/main/libs)). This confirms what you heard. `deno_runtime` is a crate in the same repo (`runtime/`), and crates.io shows `deno_core 0.413.0` updated 2026-10-21 ([crates.io](https://crates.io/crates/deno_core)). After the wind-down nobody is paid to keep these crates stable for embedders. **[Speculation, no source says it]**.
- Fallout: Val Town, "fundamentally organized around the Deno runtime", announced it is winding down on 2026-11-10 and plans to open-source itself on 2027-02-01 ([HN 50443427](https://news.ycombinator.com/item?id=50443427), [announcement](https://blog.val.town/winding-down)). Supabase Edge Functions run on `supabase/edge-runtime`, "an older version of Deno" ([HN comment in 50019911](https://news.ycombinator.com/item?id=50019911)). Netlify "still uses the Deno runtime" (same thread).
- Process per tool, measured here (Apple Silicon Mac, macOS 27.2, Deno 2.9.8, `deno serve` hello world, 5 runs): 26-31 ms from spawn to first response, 41.6 MB idle RSS each, 832 MB for 20 processes. Method and caveats under E.
- Fidelity: `deno serve` accepts a default-exported `fetch`, but no Cloudflare bindings, Durable Objects or queue handlers exist. We would write them. Deno has no `workerd`-style compat dates.
- Open pieces on offer: `denoland/denokv` (self-hosted KV backend, MIT, 0.14.0, 2026-06-06, [repo](https://github.com/denoland/denokv)), Deno Deploy "self-host" claims **[unverified]**.

**Verdict.** Do not build on Deno or deno_runtime. A sunset runtime plus a shim we must write is the worst of both.

### 3. Bun

- Repo: 96.8k stars, v1.4.5 on 2026-11-19 ([GitHub](https://github.com/oven-sh/bun/releases)). Anthropic acquired Bun in December 2025; Bun states it stays open source and MIT-licensed ([Bun blog](https://bun.com/blog/bun-joins-anthropic)). Disclosure: I am an Anthropic model, so weigh this entry with that in mind. The GitHub licence field reads "NOASSERTION" because Bun statically links LGPL-2 JavaScriptCore ([LICENSE.md](https://github.com/oven-sh/bun/blob/main/LICENSE.md)).
- Process per tool, measured here (Bun 1.4.3, `export default { fetch }`, 5 runs): 36-107 ms to first response (first run was a cold outlier), 26.8 MB idle RSS, 535 MB for 20 processes.
- Memory risk under real frameworks: issue [oven-sh/bun#34389](https://github.com/oven-sh/bun/issues/34389) reports a Next.js standalone server at about 670 MB idle RSS on Bun 1.3.14 versus 80 MB on Node 24 (closed, 2026-07-16). One report, but it matters for a "near-zero idle cost" goal.
- No sandbox and no Workers bindings. Same shim burden as Deno, and it is a JavaScriptCore engine, not V8, so subtle behaviour differs from Workers.

**Verdict.** Reasonable only as a fast `anvil dev` fallback or a stateless-tool runner. It fails the "same bundle, same behaviour" goal.

### 4. Our own V8 embedding (rusty_v8)

- `denoland/rusty_v8`: 4,042 stars, MIT, release v152.2.0 on 2026-08-20, 38M downloads ([GitHub](https://github.com/denoland/rusty_v8), [crates.io](https://crates.io/crates/v8)). Contributor list is led by `piscisaureus` (278), `bartlomieju` (235), `ry` (229) ([contributors](https://github.com/denoland/rusty_v8/graphs/contributors)). These are the same people now at Cloudflare. The Deno blog says Cloudflare will keep supporting rusty_v8 and "work toward integrating it into workerd" ([Deno blog](https://deno.com/blog/cloudflare)); that is from a page summary I could not re-read, so treat as **[unverified detail]**.
- Cadence: 14 releases between 2026-04-24 and 2026-08-20 (V8 147 to 152), none since 2026-08-20 as of today ([releases](https://github.com/denoland/rusty_v8/releases)). Keeping up with V8 majors every few weeks is a standing chore.
- celld pins `v8 = "152.1"` directly and builds on Tokio, with no deno_core ([Cargo.toml](https://github.com/denoland/celld/blob/main/Cargo.toml)). It is 4.7 MB of Rust and 1.3 MB of JavaScript ([languages](https://github.com/denoland/celld)), written by Dahl and a Deno core engineer. That is the size of "do it properly", for a project that still says "beta".
- OpenWorkers took this path. `openworkers-runtime-v8` is "built on rusty_v8", with a pinned isolate pool (cold start "tens of µs", no methodology), MIT, 93 stars ([repo](https://github.com/openworkers/openworkers-runtime-v8)). Its earlier `deno_core` runtime is archived and "does not build against current platform versions" ([repo](https://github.com/openworkers/openworkers-runtime)). The main developer is one person (`max-lt`, 418 and 343 commits in the two repos, [contributors](https://github.com/openworkers/openworkers-runner/graphs/contributors)). The Show HN says limits are 128 MB and 100 ms CPU, and Durable Objects, WebSockets, HTMLRewriter and the cache API are not implemented ([HN 46454693](https://news.ycombinator.com/item?id=46454693)).
- On OpenWorkers' sandbox claim, simonw: "they have to provide very solid guarantees." The author then removed "secure" and "untrusted" from the marketing ([same thread](https://news.ycombinator.com/item?id=46454693)).

**Verdict.** Maximum control, minimum leverage. A small team re-creating the Workers surface and keeping up with V8 is exactly what Cloudflare and Deno's former team (now Cloudflare) are doing at scale.

### 5. Something else

**celld (the closest thing to Anvil)**

- 6,352 stars, Apache-2.0, v0.6.3 on 2026-10-21, twelve releases since 2026-08-05 ([releases](https://github.com/denoland/celld/releases)). Two contributors listed (`ry`, `bartlomieju`). Pull requests are disabled, patches go by email ([README](https://github.com/denoland/celld)).
- Supports Workers, DO (SQLite, alarms, hibernating WebSockets), KV, Queues, D1, R2, Workflows, cron, static assets, Dynamic Workers and Tail Workers; Containers experimental. Not supported: Workers AI, Vectorize, Hyperdrive, Browser Rendering, Email Workers; Python Workers partial; `wrangler.toml` is rejected, `routes` rejected ([compat](https://github.com/denoland/celld/blob/main/docs/cloudflare-compat.md)).
- Hard limits for us: "A fleet runs one application", no multi-tenant scheduler; durable state needs an S3-compatible, GCS or Azure bucket with conditional writes (only `celld dev` uses local SQLite); no TLS termination; plain-HTTP peer traffic ([limitations](https://github.com/denoland/celld/blob/main/docs/limitations.md), [guarantees](https://github.com/denoland/celld/blob/main/docs/guarantees.md)). Security: "not safe for hostile multi-tenant use" ([security](https://github.com/denoland/celld/blob/main/docs/security.md)). No rolling upgrades ([Umesh Malik](https://umesh-malik.com/blog/self-host-cloudflare-workers-workerd-celld)).
- Numbers (vendor laptop benchmark relayed by a blogger): about 4 MB RAM per resident trivial cell, about 1,000 cells on 8 GB, about 4 ms to wake a hibernated cell, about 90 ms durable write ([Flavio Copes](https://flaviocopes.com/celld/)).
- It will be merged into workerd, no date ([Cloudflare blog](https://blog.cloudflare.com/deno-joins-cloudflare/)). Commenters read it as burial of the standalone project: "Sounds like Celld will live on within workerd, Deno is over." ([pimterry, HN 50019911](https://news.ycombinator.com/item?id=50019911)).

**Rivet**

- 6,971 stars, Apache-2.0, v2.3.33 on 2026-11-21 ([GitHub](https://github.com/rivet-dev/rivet)). Actors with in-memory state, SQLite, WebSockets, scheduling; self-host on Docker, Kubernetes or a VM with an object-store bucket, local filesystem for single-machine trials; runs on stock Node.js and Bun with no custom runtime ([README](https://github.com/rivet-dev/rivet)). It is an alternative to Durable Objects, not a Workers runtime, and has no Workers API. Not a fit for "one bundle, two targets".

**Supabase edge-runtime**

- 999 stars, MIT, v1.79.3 on 2026-11-20, "Beta Software" with expected breaking changes, Deno-based, main and user runtimes with memory and timeout limits ([repo](https://github.com/supabase/edge-runtime)). Three main contributors. Self-hosted defaults of 150 MB and 400 s were reported in docs ([self-hosted functions](https://supabase.com/docs/guides/self-hosting/self-hosted-functions)). It is the best example of Deno embedding with per-tool limits, but no Workers fidelity, and it sits on the Deno wind-down.

**Dead or fading**

- WinterJS (Wasmer): archived, last push 2026-03-17 ([repo](https://github.com/wasmerio/winterjs)).
- Lagon: archived, last push 2024-05-29, AGPL-3.0 ([repo](https://github.com/lagonapp/lagon)).
- Miniflare 2: archived ([repo](https://github.com/cloudflare/miniflare)).
- Blueboat: repo not found by my queries, **[unverified]** whether it exists.
- OpenWorkers `deno`, `scheduler`, `logs`, `dash` repos: archived ([org](https://github.com/openworkers)).

**Alive, not a fit as the executor**

- LLRT (AWS): 8.9k stars, v0.10.0-beta, "experimental", QuickJS-based for Lambda ([repo](https://github.com/awslabs/llrt)).
- txiki.js: 3.3k stars, release v26.11.0 ([repo](https://github.com/saghul/txiki.js)). Small engine, no Workers API.
- Boa (Rust JS engine): 7.7k stars, v0.22 ([repo](https://github.com/boa-dev/boa)). Not yet a Workers-grade engine.
- Spin (6.6k stars, v4.3.0), wasmCloud (2.5k stars, v2.12.2), StarlingMonkey (302 stars, Apache-2.0), jco (1k stars): Wasm component route, JS runs inside Wasm. Different programming model from Workers; fidelity requires a Workers shim in a component. I did not test any of it ([Spin](https://github.com/spinframework/spin), [wasmCloud](https://github.com/wasmCloud/wasmCloud), [StarlingMonkey](https://github.com/bytecodealliance/StarlingMonkey)).
- PartyKit / `partyserver`: Cloudflare-owned, 1.3k stars, on Durable Objects ([repo](https://github.com/cloudflare/partykit)). It is a library over Workers, so it runs wherever our Workers runtime runs. Same for `agents` (6k stars, [repo](https://github.com/cloudflare/agents)).
- Nitro (11.4k stars) and unenv (773 stars, [repo](https://github.com/unjs/unenv)): they target Workers as a preset and polyfill Node APIs. They are build-side tools, not runtimes. Hono (33k stars, [repo](https://github.com/honojs/hono)) runs everywhere on the `fetch` shape, but it covers routing only, not bindings.
- Fly Machines as a pattern: suspend/resume is documented as "a few hundred ms", with a fallback to a 2+ s cold start, and a community user reported up to 50 s ([docs](https://fly.io/docs/reference/suspend-resume/), [forum](https://community.fly.io/t/ridiculously-long-times-for-starting-suspended-machines/26039)). It is a hosting pattern for a tool-per-VM design, not something one binary on a customer server reproduces.
- Coolify / Dokploy ("process per app", 38.6k stars for Dokploy, licence NOASSERTION, [repo](https://github.com/Dokploy/dokploy)): they run containers, which gives isolation but not scale-to-zero density or Workers bindings.
- Trigger.dev (16.8k stars, [repo](https://github.com/triggerdotdev/trigger.dev)), Unikraft, Bunny Edge Scripting, Fastly `js-compute-runtime`: I did not research their runtimes in depth. **[unverified]**.

## C. WinterTC in 2026

- ECMA-429 "Minimum common web API", 1st edition, December 2025, is published by Ecma TC55. It is "a curated subset of APIs defined by web platform standards", aimed at server runtimes ([Ecma](https://ecma-international.org/publications-and-standards/standards/ecma-429/)). The group plans yearly snapshots and a WPT subset as test suite ([W3C minutes, 2025-11-12](https://www.w3.org/2025/11/12-wintertc-minutes.html)). I found no 2026 snapshot **[unverified]**. Ecma TR/114 "Runtime keys" (June 2026) is a separate report and says inclusion does not imply conformance ([Ecma TR/114](https://ecma-international.org/wp-content/uploads/ECMA_TR-114_1st_edition_june_2026.pdf)).
- Who implements: workerd runs WPT suites daily (many "wpt" commits on 2026-11-21, [commits](https://github.com/cloudflare/workerd/commits/main)); Node, Deno and Cloudflare take part. In the minutes, Bun "has joined some sessions" but its conformance is "unclear" ([minutes](https://www.w3.org/2025/11/12-wintertc-minutes.html)).
- What it does not cover: the minutes list the Minimum Common API, sockets, CLI APIs, Fetch changes and WebCrypto. Nothing there covers the `export default { fetch, scheduled, queue }` shape, `env` bindings, Durable Objects or queue handlers. "Write to WinterTC, run anywhere" holds for pure web-API code (Hono, `fetch`, `crypto`, streams). It does not hold for a bundle that uses `env.DB`, `env.KV` or DO stubs. Those exist only where someone implements Cloudflare's binding shapes: workerd, celld, or our own shim. That gap is the reason candidates 2 to 4 cost extra.

## D. Embedding V8 or Deno in Rust

- deno_core: archived 2026-04-02, merged into `denoland/deno` ([repo](https://github.com/denoland/deno_core)). Confirmed. Still published to crates.io from the main repo ([crates.io](https://crates.io/crates/deno_core)).
- deno_runtime: crate in the Deno repo, `runtime/` ([tree](https://github.com/denoland/deno/tree/main)), latest crate update 2026-10-21 ([crates.io](https://crates.io/crates/deno_runtime)). It is a heavy dependency (Node compat, npm, permissions) that exists to serve the Deno CLI.
- How the embedders keep up:
  - OpenWorkers: first on deno_core (now archived), then straight onto rusty_v8; one developer; one HN commenter said that using Claude to rewrite code on rusty_v8 "worries me" ([HN 46454693](https://news.ycombinator.com/item?id=46454693)).
  - Supabase edge-runtime: Deno-based, three core contributors, running "an older version of Deno" ([HN](https://news.ycombinator.com/item?id=50019911)).
  - celld: no deno_core; copies versions from Deno's workspace for crypto crates ("Versions follow deno's workspace.", [Cargo.toml](https://github.com/denoland/celld/blob/main/Cargo.toml)).
- There is no published figure for the team size or cost needed to maintain an embedding. The only signal is the shape of the projects above: the ones that cover the Workers surface (celld, workerd) are built by people who also wrote Deno's core, or by Cloudflare's runtime team (workerd top contributors: jasnell 2,987 commits, kentonv 977, [contributors](https://github.com/cloudflare/workerd/graphs/contributors)).

## E. Numbers people publish, and ours

**Published (treat as indicative).**

- Cloudflare says an isolate starts about 100 times faster and uses about one tenth of the memory of a Node process in a container or VM; this is a ratio, not an absolute figure ([Cloud Computing without Containers](https://blog.cloudflare.com/cloud-computing-without-containers/), via search summary, page not re-read). Absolute per-isolate megabytes in third-party posts disagree (2 to 5 MB, [DEV Community](https://dev.to/kunal_d6a8fea2309e1571ee7/cloudflare-workers-v8-isolates-100x-faster-cold-starts-for-ai-agents-at-the-edge-2026-37oi)) and I would not rely on them.
- celld: about 4 MB per resident cell, about 1,000 per 8 GB, about 4 ms wake ([Flavio Copes](https://flaviocopes.com/celld/)). Vendor laptop benchmark.
- Idle RSS for Bun, Deno, Node ranges from 18 to 51 MB across low-authority blog posts with no shared method ([DEV Community](https://dev.to/jsgurujobs/bun-vs-deno-vs-nodejs-in-2026-benchmarks-code-and-real-numbers-2l9d)). Not used.
- workerd density per GB: **no published number found**.

**Measured here, 2026-11-21.** MacBook, Apple Silicon, macOS 27.2. Hello-world `fetch` server, 5 starts each, a Python loop polling every 2 ms (adds some overhead), RSS from `ps` (on macOS, includes shared pages). 20 concurrent processes after 2 s idle. Scripts were in the session scratchpad, not committed.

| Runtime (version)         | Spawn to first response   | Idle RSS per process | 20 processes total | Processes per GB (naive) |
| ------------------------- | ------------------------- | -------------------- | ------------------ | ------------------------ |
| Node 24.21.0              | 62-83 ms                  | 62.7 MB              | 1,255 MB           | ~16                      |
| Bun 1.4.3                 | 36-107 ms (first run 107) | 26.8 MB              | 535 MB             | ~38                      |
| Deno 2.9.8 (`deno serve`) | 26-31 ms                  | 41.6 MB              | 832 MB             | ~24                      |

Meaning: process-per-tool puts the floor at 25 to 60 MB idle per tool before any tool code. At 4 MB per cell (celld) the same server holds an order of magnitude more tools. For a customer with 30 tools, process-per-tool costs 0.8 to 1.9 GB idle; an isolate runtime costs a fraction. I did not measure workerd or celld here (not installed; I did not download binaries). This is the first thing to measure in the spike below.

## F. Opinions worth quoting

For workerd and the merge:

- "workerd has always had one big gap in its production-readiness: Durable Objects." Kenton Varda ([Cloudflare blog](https://blog.cloudflare.com/deno-joins-cloudflare/)).
- "This is not a parallel implementation, it's the same code we run in production." Kenton Varda (same post).
- "Sounds like Celld will live on within workerd, Deno is over." pimterry ([HN 50019911](https://news.ycombinator.com/item?id=50019911)).

Against workerd self-hosted:

- "buggy as hell when self-hosted." buremba ([HN 46454693](https://news.ycombinator.com/item?id=46454693)).
- "Do not assume that self-hosted workerd applies Cloudflare CPU, memory, or subrequest limits." Flavio Copes ([post](https://flaviocopes.com/workerd/)).

For celld and the single-binary idea:

- "one binary, written in Rust, with object storage as its only external service dependency." Ryan Dahl ([Cloudflare blog](https://blog.cloudflare.com/deno-joins-cloudflare/)). Note that this dependency is a cost for us.

Against Deno:

- "Deno turned out unfortunately to be a miss." cscheid ([HN 50019911](https://news.ycombinator.com/item?id=50019911)).
- "Honestly migrating back is trivial now." hodder (same thread), a counterpoint: leaving Deno is cheap when you only used web APIs.

On sandboxing claims:

- "Over promising on security hurts the credibility of the entire project." gpm ([HN 46454693](https://news.ycombinator.com/item?id=46454693)).

For and against Bun: I found no quotable first-hand account worth citing; the only hard evidence is the memory issue above ([#34389](https://github.com/oven-sh/bun/issues/34389)).

## What the evidence favours

**Ranked recommendation**

1. **Anvil as a thin Rust supervisor over a pinned stock `workerd`.** Anvil generates the Cap'n Proto (or `wrangler.jsonc`) config per installation, runs one workerd process hosting many tools as isolates, owns the control plane (deploy, secrets, logs, cron, health, restarts), and adds the missing guardrails: per-tool memory and CPU enforcement from outside (cgroups on Linux, polling on macOS), and OS-level confinement for tool-to-tool isolation. State stays on local disk, which is what workerd supports today, and the single-instance Durable Object limit is irrelevant on one server. Fidelity is as good as it gets, and the maintainers are Cloudflare's runtime team, who just hired the celld authors to make self-hosting first-class.
2. **Track celld as the convergence path, do not adopt it now.** The code is Apache-2.0 and is the best reading material for what a Rust+V8 Workers host needs. Its "one fleet, one app", bucket dependency and beta status do not fit a many-tools-per-server product, and it is being folded into workerd.
3. **Bun (or Node) process per tool plus a bindings shim, for `anvil dev` fallback only.** Cheap, but 27 MB or more per tool, no isolation story, and behaviour that differs from Workers. Useful if workerd cannot run on a developer platform we care about (celld lists Windows as unsupported too; workerd needs glibc 2.35 on Linux).
4. **Own rusty_v8 embedding.** Only if the spike below fails and we choose control over effort. Expect to rebuild the Workers surface and follow V8 majors every few weeks.
5. **Deno or deno_runtime.** Not recommended: sunset in about a year.

**Spike to settle the open points (small)**

1. Run `workerd serve --experimental` on a real Forgeron tool bundle with D1, KV, R2, Queues, cron, one DO, and a Worker Loader example. Record what breaks.
2. Measure idle RSS and first-request time for 1, 10 and 30 workers in one workerd process on a 2 GB Linux box. Compare with the 27 to 63 MB per-process numbers above.
3. Kill -9 workerd during a DO write and a `waitUntil` task. Record what is lost.
4. Check whether Cloudflare's limits can be mimicked (CPU time, memory) from outside.

**What would flip the ranking**

- To celld or merged workerd cluster mode as the base: the merge lands with a local-disk, single-node mode and multi-app support, or we later need more than one server.
- To a Bun/Node shim (rank 3 first): the spike shows workerd's `--experimental` bindings are too buggy (buremba's claim holds) or per-tool memory in workerd is no better than 25 MB.
- To our own rusty_v8 embedding: Cloudflare stops publishing prebuilt workerd binaries, changes its licence, or workerd's isolation cannot be confined well enough, and a customer demands a single static binary. It also becomes more attractive if coding agents make the Workers surface cheap to reimplement, but the maintenance of V8 bumps stays.
- To microVMs or containers per tool (Fly/Unikraft pattern): tools become untrusted third-party code. workerd's own README says to use a VM then.
- Away from the whole plan: Cloudflare's post gives no dates ("in the coming months"); if the self-hosting effort stalls, rank 1 remains usable but without a path to multi-node.

## Gaps in this research

- Reddit was not reachable through the search tool; no r/selfhosted, r/CloudFlare, r/node, r/rust, r/Deno or r/bun threads. The only user reports come from Hacker News and blogs.
- The Register article on celld was in search results but I could not fetch it (socket closed); its cost-dispute claim (Cloudflare disputing celld's cost figures) is from a search summary only **[unverified]**.
- workerd standalone memory and density, Worker Loader maturity in standalone mode, and Bunny Edge Scripting, Unikraft, trigger.dev runtime details were not verified.
- Star counts, licences, releases and contributors come from the GitHub API on 2026-11-21 and will drift.
