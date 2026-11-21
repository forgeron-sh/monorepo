# Contract: `kv`

> Status: proposal (21 November 2026). Version `kv@1`. Prefix `KV`. Mirrors Cloudflare Workers KV. See [README](README.md).

## 1. Purpose

Keys and small values that are read far more often than they are written: reference data fetched from an upstream, a person's preferences, a token kept between calls. It is **eventually consistent**: a value written now may not be read back for a minute, and two writers to one key do not coordinate. A tool uses it through `ctx.cache`, which adds a scope (per person or per tool) and JSON values. Anything that must be read back at once, counted, or coordinated belongs in the database.

## 2. Declaration

Today (`packages/sdk/src/config.ts`):

```ts
resources: {
  cache: kv({ why: "Reference data from the HR system" }),
}
```

The manifest stores `cache: { why? }`. It already names no product; it stays as it is. The contract is called `kv`; the manifest key and `ctx` member stay `cache`.

## 3. Interface

What a provider implements (`@forgeron/contracts`), a subset of the KV binding ([read](https://developers.cloudflare.com/kv/api/read-key-value-pairs/), [write](https://developers.cloudflare.com/kv/api/write-key-value-pairs/), [list](https://developers.cloudflare.com/kv/api/list-keys/)):

```ts
export interface Kv {
  /** The value, or `null` when the key is absent or expired. `type` defaults to "text". */
  get(key: string, type?: "text"): Promise<string | null>;
  get<T = unknown>(key: string, type: "json"): Promise<T | null>;
  get(key: string, type: "bytes"): Promise<Uint8Array | null>;
  /** The value and its metadata (`null` when none was stored). */
  getWithMetadata<M = unknown>(
    key: string,
    type?: "text" | "json" | "bytes",
  ): Promise<{ value: unknown | null; metadata: M | null }>;
  /** Writes the value. Resolves once accepted; visible later (KV-N1). */
  put(
    key: string,
    value: string | Uint8Array,
    options?: {
      /** Seconds since the epoch. */
      expiration?: number;
      /** Seconds from now, at least 60 (KV-L05). */
      expirationTtl?: number;
      /** JSON-serialisable, 1,024 bytes once serialised (KV-L03). */
      metadata?: unknown;
    },
  ): Promise<void>;
  /** Removes the key. Resolves once accepted; the old value may still be read (KV-N2). */
  delete(key: string): Promise<void>;
  /** Keys in UTF-8 byte order, at most `limit` (1,000 by default and at most). */
  list<M = unknown>(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{
    keys: { name: string; expiration?: number; metadata?: M }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}
```

Left out of `kv@1`: `stream` reads and `ReadableStream` writes, bulk `get` of up to 100 keys, and `cacheTtl` (a Cloudflare edge-cache tuning knob; the provider may set it).

What a tool sees on top: `ctx.cache` (`packages/sdk/src/context.ts`): `get(key, { scope })`, `set(key, value, { ttl, scope })`, `getOrSet(key, { ttl, scope }, compute)`, `delete(key, { scope })`. The SDK maps it onto `Kv`: the key becomes `u:<person id>:<key>` (scope `user`, the default) or `t:<key>` (scope `tool`); the value is JSON; `ttl` becomes `expirationTtl`.

Where today's code differs:

- **`ctx.cache` does not exist in a deployed tool.** Hosting creates and binds a KV namespace (`CACHE`, `<worker>--cache`, `packages/hosting/src/resources.ts`), but the generated Worker entry passes only `env.DB` to the runtime (`packages/compiler/src/build.ts`), so `platform.cache` keeps its default, a proxy that throws on any member (`missing("cache")` in `packages/runtime/src/engine.ts`).
- **The only implementation is the test one** (`packages/sdk/src/testing/cache.ts`): a `Map`, values never expire, every read sees the last write. It is stronger than the contract on every point; it should apply KV-N1 too (open question 3).
- `CacheOptions.ttl` accepts any number of seconds; KV refuses fewer than 60 (KV-L05).

## 4. Guarantees

| Id    | Guarantee                                                                                                                                                                                          | Cloudflare source                                                                                                                                                         | Anvil                                                      |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| KV-01 | **Eventual visibility.** A `put` or `delete` that resolved becomes visible to every reader, with no stated upper bound; usually within 60 s.                                                       | "Changes may take up to 60 seconds or more to be visible in other global network locations" ([how KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/)) | immediate (one SQLite table); dev chaos delays it (KV-N1)  |
| KV-02 | **Last write wins.** Of concurrent writes to one key, one value remains whole; values are never merged or torn.                                                                                    | "If concurrent writes are made to the same key, the last write will take precedence" ([write](https://developers.cloudflare.com/kv/api/write-key-value-pairs/))           | one row per key, `INSERT … ON CONFLICT DO UPDATE`          |
| KV-03 | **Round trip.** A value read back is the one written, byte-identical; metadata reads back as written JSON.                                                                                         | [read](https://developers.cloudflare.com/kv/api/read-key-value-pairs/), [write](https://developers.cloudflare.com/kv/api/write-key-value-pairs/)                          | value stored as a BLOB, metadata as JSON text              |
| KV-04 | **Absent is `null`.** A missing or expired key reads as `null`, never throws.                                                                                                                      | "the literal value `null`" ([read](https://developers.cloudflare.com/kv/api/read-key-value-pairs/))                                                                       | same                                                       |
| KV-05 | **Not before expiration.** A key is not removed before its `expiration` / `expirationTtl`. After it, the key stops being returned (KV-N5 for how soon).                                            | "it will be deleted from the system" ([write](https://developers.cloudflare.com/kv/api/write-key-value-pairs/))                                                           | `expires_at` column; reads filter, a sweeper deletes       |
| KV-06 | **No eviction.** A value without expiration stays until overwritten or deleted. KV is a store, not an LRU cache.                                                                                   | Implied: no eviction is described on the pages fetched: **UNVERIFIED**                                                                                                    | no eviction                                                |
| KV-07 | **List order and paging.** `list` returns keys in UTF-8 byte order, at most 1,000 per page; `list_complete: false` comes with a `cursor` that continues it; a page may be empty while more follow. | [list](https://developers.cloudflare.com/kv/api/list-keys/)                                                                                                               | `ORDER BY key` on a `BLOB` key; cursor is the last key     |
| KV-08 | **Durability.** A `put` that resolved is not lost by a provider restart.                                                                                                                           | Not stated on the pages fetched: **UNVERIFIED**                                                                                                                           | SQLite WAL, `synchronous = FULL` in `serve`                |
| KV-09 | **Isolation between tools.** A tool reads and lists only its own keys.                                                                                                                             | One namespace per Worker (`<worker>--cache`)                                                                                                                              | one table per tool and channel, in the tool's channel file |
| KV-10 | **Isolation between channels.** Each channel has its own namespace; a branch starts empty.                                                                                                         | One namespace per channel's Worker                                                                                                                                        | one table per channel                                      |
| KV-11 | **Scope isolation** (SDK, `ctx.cache`). A `user`-scoped key is only reached by the same person; no input of a tool can build another person's key.                                                 | SDK key prefix                                                                                                                                                            | same SDK code                                              |

## 5. Non-guarantees

| Id    | A tool must not rely on                                                                                                                                                                                                                       | Anvil dev chaos                                                                        |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| KV-N1 | **Read after write, even in the same call.** Cloudflare: "usually immediately visible" at the same location, but "it is not advised to rely on this behaviour" ([how KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/)). | after a `put`, each reader keeps seeing the previous value for a random 0–60 s per key |
| KV-N2 | **A delete being seen at once.**                                                                                                                                                                                                              | after a `delete`, the old value is returned for 0–60 s                                 |
| KV-N3 | **A `null` read being current.** Negative lookups are cached too ([how KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/)).                                                                                               | a key read as absent stays absent for that reader 0–60 s after it is written           |
| KV-N4 | **Order between keys.** Writing A then B, a reader may see B and not A.                                                                                                                                                                       | per-key delays are independent                                                         |
| KV-N5 | **Expiration being punctual.** A key may still be read for a while after it expired.                                                                                                                                                          | an expired key is still returned for 0–60 s                                            |
| KV-N6 | **Atomic read-modify-write.** There is no increment, no compare-and-set, no transaction. Two calls that read, add one and write lose an update.                                                                                               | concurrent writes in `forgeron test --chaos` interleave reads and writes               |
| KV-N7 | **`list` reflecting recent writes.** It has the same delay ([list](https://developers.cloudflare.com/kv/api/list-keys/)).                                                                                                                     | `list` is served from a snapshot up to 60 s old                                        |
| KV-N8 | **More than one write per second to a key.** Cloudflare answers 429 ([write](https://developers.cloudflare.com/kv/api/write-key-value-pairs/)).                                                                                               | enforced in both profiles: `KV_RATE_LIMITED` (KV-L04)                                  |
| KV-N9 | **`getOrSet` running `compute` once.** Two calls that miss together both compute; and because of KV-N1 a call may compute again just after another one stored.                                                                                | follows from KV-N1                                                                     |

## 6. Limits

Source: [KV limits](https://developers.cloudflare.com/kv/platform/limits/) unless stated.

| Id     | Limit                                                   | Cloudflare                                                                                              | Contract                                                                                       |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| KV-L01 | Key size                                                | 512 bytes                                                                                               | 512 bytes, after the SDK's scope prefix (so about 470 for a tool's own part with scope `user`) |
| KV-L02 | Value size                                              | 25 MiB                                                                                                  | 25 MiB (open question 2)                                                                       |
| KV-L03 | Metadata, serialised                                    | 1,024 bytes                                                                                             | 1,024 bytes                                                                                    |
| KV-L04 | Writes to one key                                       | 1 per second; more gives 429 ([write](https://developers.cloudflare.com/kv/api/write-key-value-pairs/)) | 1 per second                                                                                   |
| KV-L05 | Minimum `expirationTtl`, and `expiration` in the future | 60 s ([write](https://developers.cloudflare.com/kv/api/write-key-value-pairs/))                         | 60 s                                                                                           |
| KV-L06 | Operations per call                                     | 1,000, external calls included ([limits](https://developers.cloudflare.com/kv/platform/limits/))        | 1,000                                                                                          |
| KV-L07 | Keys per `list` page                                    | 1,000 ([list](https://developers.cloudflare.com/kv/api/list-keys/))                                     | 1,000                                                                                          |

## 7. Errors

| Code                 | Retryable | When                                                                                                         |
| -------------------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| `KV_KEY_INVALID`     | no        | Empty key, or over KV-L01.                                                                                   |
| `KV_VALUE_TOO_LARGE` | no        | Value over KV-L02, or metadata over KV-L03.                                                                  |
| `KV_TTL_INVALID`     | no        | `expirationTtl` under 60, or `expiration` less than 60 s ahead (KV-L05).                                     |
| `KV_RATE_LIMITED`    | yes       | A second write to one key within a second (KV-L04), or KV-L06 reached. Maps to `RATE_LIMITED` when uncaught. |
| `KV_UNAVAILABLE`     | yes       | The provider could not reach the store. A `put` may have been accepted.                                      |

## 8. Conformance

| Case    | Proves     | What it does                                                                                                              |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| KV-01.a | KV-01      | put, then poll `get` for up to 120 s: the value appears                                                                   |
| KV-02.a | KV-02      | 10 concurrent puts of distinct 1 MB values: after settling, one of them is read, whole                                    |
| KV-03.a | KV-03      | round-trip text, JSON, bytes (0 B, 1 B, 1 MiB, 25 MiB) and metadata                                                       |
| KV-04.a | KV-04      | `get` of a never-written key is `null`, for every `type`                                                                  |
| KV-05.a | KV-05      | a key with `expirationTtl: 60` is readable at 30 s (after KV-01 settles) and absent by 180 s                              |
| KV-07.a | KV-07      | 2,500 keys with mixed-case and non-ASCII names: three pages, byte order, cursor continues, prefix filters                 |
| KV-08.a | KV-08      | Anvil: kill after a resolved put, restart, read it                                                                        |
| KV-09.a | KV-09      | tool A and tool B write the same key: each reads its own                                                                  |
| KV-10.a | KV-10      | two channels of one tool: same                                                                                            |
| KV-11.a | KV-11      | person A's `user`-scoped key is absent for person B; a key containing `:` or `u:` cannot reach another scope              |
| KV-L.a  | KV-L01–L07 | at each limit succeeds; over it fails with the listed code                                                                |
| KV-N.a  | KV-N1–N7   | Anvil dev: a read right after a put returns the old value at least once in 100 tries; same for delete, null, expiry, list |

## 9. Open questions

1. **Should `ctx.cache` keep the name "cache"?** KV does not evict (KV-06), so it is a store with weak consistency, not a cache. Recommendation: keep `cache` (it is how tools should use it: reproducible data), and say in `sdk.md` that it is not evicted and not read-after-write.
2. **Value size.** 25 MiB matches Cloudflare, but a JSON value through `ctx.cache` that large is a mistake, and Anvil's dev memory suffers. Recommendation: the contract keeps 25 MiB; `ctx.cache` refuses JSON over 1 MiB with `KV_VALUE_TOO_LARGE`.
3. **The test double.** `memoryCache` reads its writes at once and never expires. Recommendation: give it the same chaos as Anvil dev behind `createTestTool({ chaos: true })`, on by default in `forgeron test`, so a tool's tests meet KV-N1 before production.
4. **`ttl` under 60 s in `ctx.cache`.** Refuse (`KV_TTL_INVALID`) or round up to 60. Recommendation: refuse; a silent round-up hides a design that wanted a short-lived lock, which KV cannot give.
5. **Wiring.** `platform.cache` must be built from `env.CACHE` in the Worker entry, and Anvil's from its host socket. Recommendation: do it in the same change that adds `@forgeron/provider-cloudflare`, with KV-01.a and KV-09.a as its acceptance.
