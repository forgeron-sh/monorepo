# Contract: `blob`

> Status: proposal (21 November 2026). Version `blob@1`. Prefix `BLOB`. Mirrors Cloudflare R2 through its Workers binding. See [README](README.md).

## 1. Purpose

Files a tool keeps: attachments, imports, exports, generated documents. One object store per tool and channel, never public. Objects are **strongly consistent**: once a write resolves, every read sees it. A conditional put lets a tool replace an object only if nobody changed it since it was read. A tool uses it through `ctx.files`, which checks the size and type the config declared and hands out short-lived links.

## 2. Declaration

Today (`packages/sdk/src/config.ts`, `templates/inventory/forgeron.config.ts`):

```ts
resources: {
  files: bucket({
    maxSize: "25MB",
    types: ["application/pdf", "image/*", "text/csv"],
    why: "Datasheets and photos attached to equipment",
  }),
}
```

The manifest stores `files: { maxSize, types, why? }`. It names no product; it stays. The contract is called `blob`; the manifest key and `ctx` member stay `files`.

## 3. Interface

What a provider implements (`@forgeron/contracts`), a subset of the R2 binding ([Workers API reference](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)):

```ts
export interface BlobStore {
  /** The object's metadata without its body, or `null` when absent. */
  head(key: string): Promise<BlobObject | null>;
  /**
   * The object with its body; `null` when absent. When `onlyIf` fails, the object without a body
   * (BLOB-05). `range` reads part of it (BLOB-06).
   */
  get(
    key: string,
    options?: { onlyIf?: BlobConditional; range?: BlobRange },
  ): Promise<BlobObjectBody | BlobObject | null>;
  /**
   * Stores the object, replacing any. With `onlyIf`, stores it only if the condition holds, and
   * resolves `null` otherwise, storing nothing (BLOB-04). A stream must have a known length.
   */
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | Uint8Array | string | Blob,
    options?: {
      onlyIf?: BlobConditional;
      httpMetadata?: { contentType?: string; contentDisposition?: string; cacheControl?: string };
      /** 8,192 bytes in all (BLOB-L04). */
      customMetadata?: Record<string, string>;
    },
  ): Promise<BlobObject | null>;
  /** Removes one key, or up to 1,000. Absent keys are not an error. */
  delete(keys: string | string[]): Promise<void>;
  /** Keys in lexicographic order. Check `truncated`, not the count, to know if more follow. */
  list(options?: {
    prefix?: string;
    cursor?: string;
    /** At most 1,000, the default; fewer may come back (BLOB-N2). */
    limit?: number;
    delimiter?: string;
    include?: ("httpMetadata" | "customMetadata")[];
  }): Promise<{
    objects: BlobObject[];
    truncated: boolean;
    cursor?: string;
    delimitedPrefixes: string[];
  }>;
}

export interface BlobConditional {
  etagMatches?: string;
  etagDoesNotMatch?: string;
  uploadedBefore?: Date;
  uploadedAfter?: Date;
}

export type BlobRange = { offset: number; length?: number } | { suffix: number };

export interface BlobObject {
  key: string;
  size: number;
  /** Opaque: compare it, never parse it (BLOB-N1). */
  etag: string;
  uploaded: Date;
  httpMetadata?: { contentType?: string; contentDisposition?: string; cacheControl?: string };
  customMetadata?: Record<string, string>;
}

export interface BlobObjectBody extends BlobObject {
  body: ReadableStream;
  bytes(): Promise<Uint8Array>;
  text(): Promise<string>;
}
```

Left out of `blob@1`: multipart uploads (open question 3), R2's `checksums`, `storageClass`, `version`, `ssecKey`, and conditional headers given as a `Headers` object.

What a tool sees on top, `ctx.files` (`packages/sdk/src/context.ts`): `put(content, { prefix, contentType })` returns a generated key, `get(key)` returns bytes or `undefined`, `delete(key)`, `signedUrl(key, { expiresIn })`. `sdk.md` §10 also lists `text(file)`, which the `Files` type does not have.

Where today's code differs:

- **`ctx.files` does not exist anywhere.** Hosting creates and binds an R2 bucket (`FILES`, `<worker>--files`), but the Worker entry never passes it, so `ctx.files` is the default proxy that throws (`missing("files")`, `packages/runtime/src/engine.ts`). The test platform has none either: `templates/inventory/tests/equipments.test.ts` says storing a file "cannot be run here", and `equipments.attach` has never run.
- **`maxSize` and `types` are enforced nowhere.** `templates/inventory/actions/equipments/attach.ts` checks them by hand. The contract moves the check into `ctx.files.put` (`BLOB_TOO_LARGE`, `BLOB_TYPE_REFUSED`).
- **`signedUrl` cannot be an R2 presigned URL.** "The R2 Workers API binding can't generate presigned URLs"; they need S3 credentials and SigV4, from 1 s to 7 days ([presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)). The contract makes it a platform link (open question 1).
- `ctx.files` has no `list`, `head` or conditional put; a tool that needs them has no way today. Proposed additions: `ctx.files.head(key)`, `ctx.files.list({ prefix, cursor })`, `ctx.files.put(content, { key, ifMatch })`.

## 4. Guarantees

| Id      | Guarantee                                                                                                                                                                                                                                | Cloudflare source                                                                                                                                                                                           | Anvil                                                                                      |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| BLOB-01 | **Read after write.** Once `put` resolves, every `get`, `head` and `list` sees the new object; once `delete` resolves, none sees it. Metadata changes the same.                                                                          | "Strongly consistent: readers will immediately see the latest object globally" ([consistency](https://developers.cloudflare.com/r2/reference/consistency/))                                                 | object file renamed into place, then the index row committed, before `put` resolves        |
| BLOB-02 | **`list` is current.** It returns the objects as they exist when it runs.                                                                                                                                                                | "Listing is strongly consistent" ([consistency](https://developers.cloudflare.com/r2/reference/consistency/))                                                                                               | index in SQLite                                                                            |
| BLOB-03 | **Last writer wins, whole.** Of concurrent puts or deletes on one key, the last to complete remains; a reader sees the old object or the whole new one, never a mix.                                                                     | "the last writer to complete 'wins'" ([consistency](https://developers.cloudflare.com/r2/reference/consistency/)); no torn reads is implied, not stated: **UNVERIFIED**                                     | write to a temporary file, `fsync`, `rename`                                               |
| BLOB-04 | **Conditional put.** With `onlyIf`, the object is stored only if the condition holds at the time of the write; otherwise `put` resolves `null` and stores nothing. Two conditional puts with the same `etagMatches` cannot both succeed. | "If a `put()` precondition fails, it returns `null`" ([Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)); the "cannot both succeed" part is not stated: **UNVERIFIED** | check and write under the store's per-key lock, in one SQLite transaction on the index     |
| BLOB-05 | **Conditional get.** When `onlyIf` fails, `get` resolves the object without a body; `null` means only "absent".                                                                                                                          | [Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)                                                                                                                      | same                                                                                       |
| BLOB-06 | **Range reads.** `{ offset, length }` or `{ suffix }` returns those bytes; a range past the end returns fewer bytes, not an error.                                                                                                       | [Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)                                                                                                                      | `pread` on the file                                                                        |
| BLOB-07 | **List order and paging.** Lexicographic order; `cursor` present when `truncated`; `delimiter` groups keys into `delimitedPrefixes`.                                                                                                     | [Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)                                                                                                                      | SQLite index ordered by key bytes                                                          |
| BLOB-08 | **Etag identifies content.** `etagMatches` with an etag read earlier holds while the object was not replaced by different content.                                                                                                       | R2 etags; their exact rule is not stated on the pages fetched: **UNVERIFIED**                                                                                                                               | etag = hex SHA-256 of the content                                                          |
| BLOB-09 | **Durability.** A `put` that resolved survives a provider restart.                                                                                                                                                                       | Not stated on the pages fetched: **UNVERIFIED**                                                                                                                                                             | `fsync` of the file and the directory before the index commit                              |
| BLOB-10 | **Private.** No object is reachable without the tool: no public bucket, no listing from outside. A link from `ctx.files.signedUrl` reaches one object, for its duration.                                                                 | One bucket per Worker (`<worker>--files`), no public access configured                                                                                                                                      | the store is reached only through the host socket; links are served by `anvil-front`       |
| BLOB-11 | **Isolation between tools.** A tool reaches only its own objects; `..` and absolute keys do not escape.                                                                                                                                  | One bucket per Worker                                                                                                                                                                                       | one directory per tool and channel; keys are hashed into file names, never joined as paths |
| BLOB-12 | **Isolation between channels.** Each channel has its own store; a branch starts empty.                                                                                                                                                   | One bucket per channel's Worker                                                                                                                                                                             | one directory per channel                                                                  |

## 5. Non-guarantees

| Id      | A tool must not rely on                                                                                                                                                      | Anvil dev chaos                                         |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| BLOB-N1 | **The etag's format** (an MD5, a multipart suffix, quotes). Compare it, do not parse it.                                                                                     | etags are random 16-byte hex, not a hash of the content |
| BLOB-N2 | **`list` returning `limit` objects.** It may return fewer, even with more to come ([Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)).  | pages of a random 1 to `limit` objects                  |
| BLOB-N3 | **A negative read ruling out a write.** A write in flight may commit after a `get` saw nothing ([consistency](https://developers.cloudflare.com/r2/reference/consistency/)). | none                                                    |
| BLOB-N4 | **More than one write per second to a key.** Cloudflare answers 429 ([R2 limits](https://developers.cloudflare.com/r2/platform/limits/)).                                    | enforced in both profiles: `BLOB_RATE_LIMITED`          |
| BLOB-N5 | **The key format `ctx.files.put` generates.** Store the key it returns.                                                                                                      | keys carry a random segment that changes per release    |
| BLOB-N6 | **`uploaded` as a clock.** It is the provider's time, not `ctx.now()`; it is not monotonic across objects.                                                                   | `uploaded` jittered by ±2 s                             |
| BLOB-N7 | **A link from `signedUrl` working after `expiresIn`, or not being shared.** Anyone holding it reads the object until it expires.                                             | links expire at a random 50–100 % of `expiresIn`        |
| BLOB-N8 | **A put and a database write being atomic together.** Store the object first, then the row that points to it; collect orphans.                                               | fail the call right after `put` resolves (1 %)          |

## 6. Limits

Source: [R2 limits](https://developers.cloudflare.com/r2/platform/limits/) and [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).

| Id       | Limit                   | Cloudflare                                                                                                     | Contract                                                        |
| -------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| BLOB-L01 | Key length              | 1,024 bytes                                                                                                    | 1,024 bytes, after the SDK's prefix                             |
| BLOB-L02 | One `put`               | 5 GiB per upload; but a Worker has 128 MB of memory and a request body of 100 MB on Free and Pro zones         | 100 MB per `put`, streamed; and the bucket's declared `maxSize` |
| BLOB-L03 | Object size             | 5 TiB (multipart)                                                                                              | 100 MB in `blob@1` (no multipart)                               |
| BLOB-L04 | Custom metadata         | 8,192 bytes                                                                                                    | 8,192 bytes                                                     |
| BLOB-L05 | Writes to one key       | 1 per second; more gives 429                                                                                   | 1 per second                                                    |
| BLOB-L06 | Keys per `delete`       | 1,000 ([Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/))                 | 1,000                                                           |
| BLOB-L07 | Objects per `list` page | 1,000                                                                                                          | 1,000                                                           |
| BLOB-L08 | `signedUrl` duration    | 7 days for an S3 presigned URL ([presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)) | 1 s to 24 h (open question 1)                                   |

## 7. Errors

| Code                       | Retryable | When                                                                                                                                                     |
| -------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BLOB_KEY_INVALID`         | no        | Empty key, over BLOB-L01, or a key the SDK refuses (`..`, leading `/`).                                                                                  |
| `BLOB_TOO_LARGE`           | no        | Over BLOB-L02, over the bucket's `maxSize`, or metadata over BLOB-L04.                                                                                   |
| `BLOB_TYPE_REFUSED`        | no        | `ctx.files.put` with a `contentType` outside the bucket's `types`.                                                                                       |
| `BLOB_PRECONDITION_FAILED` | no        | `ctx.files` only: a conditional put the SDK surface turns into an error rather than `null`. A tool maps it to `CONFLICT`.                                |
| `BLOB_LENGTH_REQUIRED`     | no        | A stream of unknown length given to `put` ([Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/): a `TypeError` on R2). |
| `BLOB_RATE_LIMITED`        | yes       | BLOB-L05.                                                                                                                                                |
| `BLOB_UNAVAILABLE`         | yes       | The provider could not reach the store. A `put` may have been stored.                                                                                    |

`get` and `head` of an absent key resolve `null`; they do not throw.

## 8. Conformance

| Case      | Proves          | What it does                                                                                                                 |
| --------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| BLOB-01.a | BLOB-01         | put then get, head and list at once, 100 times; delete then get at once                                                      |
| BLOB-02.a | BLOB-02         | put 10, delete 3, list: exactly 7                                                                                            |
| BLOB-03.a | BLOB-03         | 10 concurrent puts of distinct 10 MB bodies while a reader loops: every read is one whole body                               |
| BLOB-04.a | BLOB-04         | put with a stale `etagMatches` gives `null` and leaves the object                                                            |
| BLOB-04.b | BLOB-04         | 20 concurrent puts with the same `etagMatches`: exactly one succeeds                                                         |
| BLOB-05.a | BLOB-05         | get with a failing `etagDoesNotMatch` returns an object with no body                                                         |
| BLOB-06.a | BLOB-06         | offset, offset with length, suffix, past the end                                                                             |
| BLOB-07.a | BLOB-07         | 2,500 keys: pages, order, cursor, `delimiter: "/"`                                                                           |
| BLOB-08.a | BLOB-08         | re-put of different content changes the etag; `etagMatches` with the old one fails                                           |
| BLOB-09.a | BLOB-09         | Anvil: kill after a resolved put, restart, read it                                                                           |
| BLOB-10.a | BLOB-10         | the store answers no request without the tool; a `signedUrl` link works, then not after it expires, and reaches no other key |
| BLOB-11.a | BLOB-11         | tool A cannot read tool B's key; keys `../x`, `/etc/passwd`, `a/../../b` stay inside the tool                                |
| BLOB-12.a | BLOB-12         | two channels of one tool keep apart                                                                                          |
| BLOB-L.a  | BLOB-L01–L08    | at each limit succeeds; over it fails with the listed code; `ctx.files` refuses a type outside `types`                       |
| BLOB-N.a  | BLOB-N1, N2, N7 | Anvil dev: etags do not look like MD5; a list page is short at least once; a link expires early at least once                |

## 9. Open questions

1. **What `signedUrl` is.** R2 bindings cannot presign; an S3 presigned URL needs an R2 access key in the tool's Worker and reaches the bucket's S3 endpoint directly. Recommendation: make it a platform link, `https://<workspace>/t/<tool>/_f/files/<token>`, where the token is signed by the gateway, bound to the tool, the channel and the key, at most 24 h; the gateway streams the object from the binding. No R2 credential leaves the platform, and Anvil serves the same path.
2. **Should `ctx.files.put` let the tool choose the key?** Today it only takes a `prefix` and returns a generated key, which makes overwrite and conditional put impossible. Recommendation: accept an optional `key`, and `ifMatch` / `ifNoneMatch: "*"` for create-only.
3. **Multipart.** Needed for objects over 100 MB. Recommendation: leave it to `blob@2`; internal tools rarely store such files, and multipart has its own failure modes (parts left behind, 7-day abort on R2).
4. **Where `maxSize` and `types` are enforced.** In the SDK (`ctx.files`) or in the provider. Recommendation: in the SDK, which knows the manifest; the provider enforces only the contract limits.
5. **Orphans.** BLOB-N8 leaves objects no row points to. Recommendation: a platform sweep that lists objects older than a day with no reference is out of reach (the platform does not know the schema); document the order "object first, row second" and give `ctx.files.list` so a tool's own job can sweep.
