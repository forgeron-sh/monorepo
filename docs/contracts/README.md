# Contracts

> Status: proposal (21 November 2026), drafted from [`reframing.md`](../reframing.md) §4.1. Nothing here is decided until it is recorded in [`DECISIONS.md`](../DECISIONS.md). [`sdk.md`](../sdk.md) stays authoritative for the code as it is.

A tool asks for resources in `forgeron.config.ts` and receives them on `ctx`. A **contract** says what such a resource does, on every platform that runs the tool. It is the line between what we write (SDK, runtime, gateway, tools) and what runs it (a provider).

## What a contract is

Each contract has three parts:

1. **An interface**, in `@forgeron/contracts`: the TypeScript surface a provider implements. It is a small subset of the Cloudflare binding, so the Cloudflare provider is a pass-through. The SDK may build a friendlier surface on top (`ctx.db` is Kysely over the `database` contract; `ctx.cache` is a scoped JSON cache over `kv`).
2. **A specification**, in this folder: numbered guarantees, numbered non-guarantees, limits, error codes, open questions.
3. **A conformance suite**, in `@forgeron/conformance`: one or more test cases per guarantee, parameterised by provider.

The interface without the specification is a type; the specification without the suite is a wish. All three ship together, and a contract has a version (`database@1`). A change that weakens a guarantee or lowers a limit is a major version of the contract.

## The rule of the weakest guarantee

A contract states the **weakest** behaviour any provider gives. A provider may do better; a tool may never count on it.

- Cloudflare KV is eventually consistent; Anvil's KV is one SQLite table and reads its own writes. The contract says eventually consistent.
- Anvil's queue could deliver in order; Cloudflare Queues does not. The contract says unordered.
- A limit is the lowest figure among providers. Anvil has no 100 bound parameters per query; the contract keeps 100, and Anvil enforces it.

A stronger provider hides reliance on the stronger behaviour. So **Anvil's dev profile injects chaos**: it makes the behaviour a contract does not promise actually happen (stale KV reads, redelivered messages, late timers). Each non-guarantee names the chaos that exposes it. `anvil serve` runs without chaos; it enforces the limits in both profiles.

## Contracts

| Contract   | File                       | Mirrors                         | Guarantee that matters most                                 | Wave |
| ---------- | -------------------------- | ------------------------------- | ----------------------------------------------------------- | ---- |
| `database` | [database.md](database.md) | D1                              | atomic batch, no interactive transaction (D-012)            | 1    |
| `kv`       | [kv.md](kv.md)             | Workers KV                      | eventually consistent, last write wins, no read-after-write | 1    |
| `blob`     | [blob.md](blob.md)         | R2                              | strongly consistent, conditional put                        | 1    |
| `queue`    | [queue.md](queue.md)       | Queues                          | at-least-once, unordered, per-message ack, dead letters     | 1    |
| `schedule` | [schedule.md](schedule.md) | Cron Triggers                   | a due task may be missed or run twice; never early          | 1    |
| `secret`   | [secret.md](secret.md)     | Workers secrets, our sealed box | never readable back; only declared names                    | 1    |
| `realtime` | —                          | a Durable Object room           | rooms, presence, at-most-once fan-out                       | 2    |
| `workflow` | —                          | Workflows                       | memoised steps, sleep, wait for event                       | 2    |
| `ai`       | —                          | AI Gateway                      | provider-neutral chat and embed, metered, budgeted          | 2    |
| `email`    | —                          | Email Service                   | send; receive later                                         | 2    |
| `actor`    | —                          | Durable Objects                 | one instance per id, serialised, private storage            | 3    |
| `search`   | —                          | Vectorize, FTS                  | —                                                           | 3    |

Not contracts: Hyperdrive, Analytics Engine, Pipelines, Containers, service bindings, dispatch namespaces. They stay inside the Cloudflare provider.

## Where today's code stands

The six wave-1 resources are declared in the manifest, but only the database reaches `ctx` in a deployed tool. Each file says so in detail; in short:

| Resource       | Manifest | Cloudflare provisioning           | Reaches `ctx` in a deployed Worker                                                |
| -------------- | -------- | --------------------------------- | --------------------------------------------------------------------------------- |
| `db`           | yes      | yes, one D1 per Worker            | yes, `createDb(env.DB)`                                                           |
| `cache`        | yes      | yes, one KV namespace per Worker  | **no**: `platform.cache` is never set, `ctx.cache` throws                         |
| `files`        | yes      | yes, one R2 bucket per Worker     | **no**: `platform.files` is never set, `ctx.files` throws                         |
| `queue`        | yes      | **no**: provisioning answers 501  | **no**: no `enqueue`, no `queue()` handler; `queue` events run in process         |
| jobs (`jobs/`) | inferred | **no** cron trigger is registered | the Worker exports `scheduled`, but nothing calls it                              |
| `secrets`      | yes      | stored sealed in the registry     | **no**: `registry.readSecrets` has no caller outside tests; `ctx.secrets` is `{}` |

Sources: `packages/compiler/src/build.ts` (the generated Worker entry passes only `env.DB`), `packages/runtime/src/engine.ts` (defaults), `packages/hosting/src/resources.ts` (`provision`), `packages/registry/src/modules/secrets/store.ts`.

## Ids

| Kind          | Form                   | Example           | Meaning                                                    |
| ------------- | ---------------------- | ----------------- | ---------------------------------------------------------- |
| Guarantee     | `<PREFIX>-NN`          | `KV-03`           | Every provider does this; a conformance case proves it     |
| Non-guarantee | `<PREFIX>-NN` with `N` | `KV-N1`           | A tool must not rely on it; Anvil dev injects the opposite |
| Limit         | `<PREFIX>-LNN`         | `DB-L03`          | A tool stays under it; every provider enforces it          |
| Error         | `<PREFIX>_<REASON>`    | `KV_RATE_LIMITED` | A stable string code on `ContractError`                    |
| Test case     | `<id>.<letter>`        | `Q-04.b`          | A case of the suite, named after the guarantee it proves   |

Prefixes: `DB`, `KV`, `BLOB`, `Q`, `SCHED`, `SEC`; later `RT`, `WF`, `AI`, `MAIL`, `ACT`, `SRCH`. Ids are never reused: a dropped guarantee keeps its number, marked withdrawn.

## Errors

A provider throws `ContractError` (`@forgeron/contracts`) with a stable `code`, the `contract` name, a `retryable` flag and a message for the log. Providers translate their native errors (a D1 `D1_ERROR` string, an R2 429) into these codes; a tool never parses a provider's message (today `templates/crm/lib/conflict.ts` matches `/UNIQUE/` in a D1 message, which the `DB_CONSTRAINT` code replaces).

An uncaught `ContractError` leaves an action as a `ToolError` (`sdk.md` §6): `*_RATE_LIMITED` becomes `RATE_LIMITED` (429); every other code becomes `INTERNAL` (500) with the detail in the log. A tool that wants `CONFLICT` catches `DB_CONSTRAINT` or `BLOB_PRECONDITION_FAILED` and says so.

## Isolation, for every contract

Two rules hold for every wave-1 contract and are stated again in each file:

- **Between tools**: a tool reaches only its own resources. No name, key, path or id lets one tool reach another's.
- **Between channels**: each channel of a tool (production, a permanent channel, a branch's temporary channel; [`lifecycle.md`](../lifecycle.md)) has its own database, KV, blob store, queue and schedule. The only exception today is secrets, which exist in two environments (`production`, and `preview` for every other channel).

On Cloudflare this follows from one Worker per channel and resources named after it (`<worker>--db|cache|files`). On Anvil, from one SQLite file and one blob directory per tool and channel, reached through a host socket that only answers for the calling tool's own channel.

## When a provider is conformant

A provider is conformant with `<contract>@<version>` when:

1. it implements the interface of that version, with no extra member a tool can reach;
2. every test case of the suite for that version passes against it, on a pinned version of the provider (a workerd release, an Anvil release, or a real Cloudflare account through the deployed probe Worker);
3. it enforces every limit of the contract (an over-limit call fails with the contract's error code, not later and not silently);
4. for Anvil, the chaos cases pass in the dev profile: the suite checks that each non-guarantee's chaos actually happens, so a regression in the chaos mode is caught too.

The suite writes a report (`conformance/<provider>/<contract>@<version>.json`: provider version, date, cases passed). Anvil's release and every workerd bump are gated on it. The Cloudflare run is made at least once per contract version and on every Cloudflare compatibility-date bump.

## How to add a contract

1. Write `docs/contracts/<name>.md` with the nine sections of the wave-1 files: purpose, declaration, interface, guarantees, non-guarantees, limits, errors, conformance, open questions. Cite the provider documentation next to each figure; mark what could not be checked **UNVERIFIED**.
2. Record the decision in `DECISIONS.md`, with the open questions answered.
3. Add the interface and its error codes to `@forgeron/contracts` (a leaf: it imports nothing).
4. Add the cases to `@forgeron/conformance`, one or more per guarantee and per non-guarantee chaos, named after the ids.
5. Implement it in each provider until the suite passes; add the manifest key and its approval text (`sdk.md` §3) last.
6. Add the row to the table above and to `sdk.md`.
