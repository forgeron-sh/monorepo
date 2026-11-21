# Contract: `queue`

> Status: proposal (21 November 2026). Version `queue@1`. Prefix `Q`. Mirrors Cloudflare Queues. See [README](README.md).

## 1. Purpose

Work that runs after a call, outside it: send a summary, call a slow upstream, fan out a change. The call puts a message on the tool's queue and returns; a consumer of the same tool receives messages in batches and acknowledges each one. Delivery is **at least once and unordered**: a message may come twice, after one sent later, and after its retries it goes to a dead-letter queue. Today a tool reaches it only through events: `on("deal.moved", { mode: "queue" }, handler)` runs `handler` after the action succeeded (`sdk.md` §9).

## 2. Declaration

Today (`packages/sdk/src/config.ts`, `packages/manifest/src/schema.ts`):

```ts
resources: {
  queue: queue({ why: "Sending summaries" }),
}
```

The manifest stores `queue: { why? }`, already neutral; it stays. The compiler refuses a `mode: "queue"` handler without it (`packages/compiler/src/manifest.ts`). Proposed additions, all optional, in the declaration (not per handler in `queue@1`):

```ts
queue: queue({ why: "Sending summaries", retries: 3, retryDelay: "30s", deadLetter: true }),
```

## 3. Interface

What a provider implements (`@forgeron/contracts`), a subset of the Queues binding ([JavaScript APIs](https://developers.cloudflare.com/queues/configuration/javascript-apis/)). The provider owns the consumer loop and calls the runtime with each batch.

```ts
/** Producer: what the runtime (and, if open question 1 says so, a tool) sends with. */
export interface Queue<Body = unknown> {
  /** Resolves once the message is stored (Q-02). `body` is JSON-serialisable. */
  send(body: Body, options?: { delaySeconds?: number }): Promise<void>;
  /** Up to 100 messages, 256 KB in all; all are stored or the call fails. */
  sendBatch(
    messages: readonly { body: Body; delaySeconds?: number }[],
    options?: { delaySeconds?: number },
  ): Promise<void>;
}

/** Consumer: what the provider hands the runtime. */
export interface MessageBatch<Body = unknown> {
  readonly messages: readonly Message<Body>[];
  ackAll(): void;
  retryAll(options?: { delaySeconds?: number }): void;
}

export interface Message<Body = unknown> {
  /** Unique per message, the same on every delivery of it (Q-09). */
  readonly id: string;
  /** When it was sent. */
  readonly timestamp: Date;
  readonly body: Body;
  /** 1 on the first delivery (Q-08). */
  readonly attempts: number;
  /** Done: not delivered again, even if the batch fails afterwards (Q-04). */
  ack(): void;
  /** Deliver again later, counting as an attempt. */
  retry(options?: { delaySeconds?: number }): void;
}

/** The tool's side: the runtime implements it; the provider calls it. */
export interface QueueConsumer<Body = unknown> {
  queue(batch: MessageBatch<Body>): Promise<void>;
}
```

Only the `json` content type is in `queue@1`; `text`, `bytes` and `v8` ([JavaScript APIs](https://developers.cloudflare.com/queues/configuration/javascript-apis/)) are left out, so a body means the same on every provider. `metrics()` and pull consumers are left out.

What a tool sees today is not this interface but events: `ctx.emit(event, payload)` and `on(event, { mode: "queue" }, handler)`. The runtime puts a `QueuedDelivery` (`{ handler, event, payload, user }`, `packages/runtime/src/types.ts`) on the queue and the consumer calls `Runtime.deliver`. Under the contract one message is one delivery: the runtime acks it when the handler resolves and retries it when the handler throws.

### What today's code does

The queue resource is declared, typed, and checked by the compiler, then **not implemented** past that:

- **Not provisioned.** `bindingsOf` adds a `QUEUE` binding of kind `queue` (`packages/hosting/src/core.ts`), and `cloudflareResources().provision` throws `501` "cannot be provisioned … yet" for it (`packages/hosting/src/resources.ts`). A tool that declares `resources.queue` cannot be deployed on Cloudflare in either mode. The local mode (Miniflare) binds only D1, KV and R2, so it ignores the queue.
- **Not produced to.** `Platform.enqueue` exists (`packages/runtime/src/types.ts`), but the generated Worker entry never sets it (`packages/compiler/src/build.ts`).
- **Not consumed.** The Worker exports `fetch` and `scheduled`, no `queue` handler; `Runtime.deliver` has no caller in a Worker.
- **What runs instead.** Without `enqueue`, `dispatch` (`packages/runtime/src/engine.ts`) runs each `queue` handler **in process, after the action, before the response**, with up to 3 immediate retries (`RETRIES = 3`, no delay) and, on the last failure, a log line. Nothing is stored: a crash loses the work, the caller waits for it, and there is no dead letter.

`sdk.md` §9 ("run after the action is committed, through a Cloudflare Queues queue, with three retries") describes the intent, not the code.

## 4. Guarantees

| Id   | Guarantee                                                                                                                                                      | Cloudflare source                                                                                                                                                                                                                                                                                                            | Anvil                                                                                |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Q-01 | **At least once.** Every stored message is delivered to the consumer at least once, until it is acked or sent to the dead-letter queue.                        | "Queues provides at least once delivery by default" ([delivery guarantees](https://developers.cloudflare.com/queues/reference/delivery-guarantees/))                                                                                                                                                                         | `messages` table in the tool's channel file; a row leaves only on ack or dead-letter |
| Q-02 | **Stored on send.** Once `send` or `sendBatch` resolves, the message survives a provider restart.                                                              | The promise "resolves once the message is written to disk" ([JavaScript APIs](https://developers.cloudflare.com/queues/configuration/javascript-apis/)); messages "should never be lost once the write succeeds" ([how Queues works](https://developers.cloudflare.com/queues/reference/how-queues-works/))                  | committed with `synchronous = FULL` before resolving                                 |
| Q-03 | **`sendBatch` is all or nothing.**                                                                                                                             | Not stated on the pages fetched: **UNVERIFIED**                                                                                                                                                                                                                                                                              | one SQLite transaction                                                               |
| Q-04 | **Per-message ack.** An acked message is not delivered again, even if a later message of the batch fails. Of conflicting calls on one message, the first wins. | [batching and retries](https://developers.cloudflare.com/queues/configuration/batching-retries/)                                                                                                                                                                                                                             | ack deletes the row at the end of the batch                                          |
| Q-05 | **A failed batch is retried whole.** If the consumer throws (or its promise rejects), every message not acked is delivered again.                              | "the entire batch will be considered a failure and will be retried" ([JavaScript APIs](https://developers.cloudflare.com/queues/configuration/javascript-apis/))                                                                                                                                                             | same                                                                                 |
| Q-06 | **Bounded retries, then dead letter.** After `retries` failed attempts (default 3) a message goes to the tool's dead-letter queue and is kept at least 4 days. | default `max_retries` 3, then deleted unless a DLQ is set ([batching and retries](https://developers.cloudflare.com/queues/configuration/batching-retries/)); DLQ messages "persist for four (4) days" without a consumer ([dead letter queues](https://developers.cloudflare.com/queues/configuration/dead-letter-queues/)) | `dead_letters` table, 14 days                                                        |
| Q-07 | **Never early.** A message sent or retried with `delaySeconds` is not delivered before that delay.                                                             | up to 24 h delay on send and retry ([batching and retries](https://developers.cloudflare.com/queues/configuration/batching-retries/))                                                                                                                                                                                        | `visible_at` column                                                                  |
| Q-08 | **Attempts are counted.** `attempts` is 1 on the first delivery and grows by one per delivery.                                                                 | "starting at 1" ([JavaScript APIs](https://developers.cloudflare.com/queues/configuration/javascript-apis/))                                                                                                                                                                                                                 | column                                                                               |
| Q-09 | **Stable id.** `id` is unique per message and the same on every delivery of it.                                                                                | "a unique, system-generated ID"; same across redeliveries is not stated: **UNVERIFIED**                                                                                                                                                                                                                                      | ULID set on send                                                                     |
| Q-10 | **After commit.** A `queue` event emitted by an action is sent only if the action succeeded (runtime, `dispatch` runs after `run` resolved).                   | runtime behaviour, `packages/runtime/src/engine.ts`                                                                                                                                                                                                                                                                          | same runtime                                                                         |
| Q-11 | **Isolation between tools and channels.** A tool's messages reach only its own consumer, on the same channel.                                                  | one queue per channel's Worker (to be provisioned)                                                                                                                                                                                                                                                                           | one table per tool and channel                                                       |

## 5. Non-guarantees

| Id   | A tool must not rely on                                                                                                                                                                                                                              | Anvil dev chaos                                                      |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Q-N1 | **Order.** "Queues does not guarantee that messages will be delivered … in the same order in which they are published" ([how Queues works](https://developers.cloudflare.com/queues/reference/how-queues-works/)).                                   | shuffle every batch, and hold back 10 % of messages to a later batch |
| Q-N2 | **Exactly once.** A message may be delivered more than once, even after an ack ([delivery guarantees](https://developers.cloudflare.com/queues/reference/delivery-guarantees/)). Make handlers idempotent with `message.id` or a key in the payload. | redeliver 5 % of acked messages once, minutes later                  |
| Q-N3 | **Batch size or composition.** Batches hold 1 to 100 messages, gathered for up to 60 s.                                                                                                                                                              | batches of a random size, 1 to the maximum                           |
| Q-N4 | **Latency.** Delivery may wait for the batch timeout, retries, or a backlog.                                                                                                                                                                         | add 0–30 s before each batch                                         |
| Q-N5 | **One message at a time.** Several batches may be processed at once by several invocations.                                                                                                                                                          | run up to 4 batches concurrently                                     |
| Q-N6 | **The action's writes and the send being atomic together.** The action commits, then the runtime sends: a crash in between loses the event; there is no outbox (open question 3).                                                                    | fail the send after the action committed (1 %)                       |
| Q-N7 | **A message surviving without a dead-letter queue**, or beyond its retention.                                                                                                                                                                        | none: Q-06 is always on in Anvil                                     |
| Q-N8 | **The handler seeing the caller's access.** It runs as the person who emitted, from a stored copy of `User`; their access may have changed since.                                                                                                    | none                                                                 |

## 6. Limits

Source: [Queues limits](https://developers.cloudflare.com/queues/platform/limits/) unless stated.

| Id    | Limit                 | Cloudflare                                                                                                                   | Contract                                                             |
| ----- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Q-L01 | Message size          | 128 KB (1 KB = 1,000 bytes; about 100 bytes of metadata included)                                                            | 120 KB of JSON body, leaving room for the runtime's envelope         |
| Q-L02 | `sendBatch`           | 100 messages, 256 KB in all                                                                                                  | 100 messages, 256 KB                                                 |
| Q-L03 | `delaySeconds`        | 0 to 86,400 (24 h)                                                                                                           | 0 to 86,400                                                          |
| Q-L04 | Retries               | up to 100; default 3 ([batching and retries](https://developers.cloudflare.com/queues/configuration/batching-retries/))      | 0 to 10; default 3                                                   |
| Q-L05 | Batch size            | 1 to 100; default 10                                                                                                         | the provider chooses, at most 100                                    |
| Q-L06 | Batch wait            | 0 to 60 s; default 5 s                                                                                                       | the provider chooses, at most 60 s                                   |
| Q-L07 | Retention             | up to 14 days (Paid), 24 h (Free)                                                                                            | 24 h before a first delivery attempt is guaranteed (open question 4) |
| Q-L08 | Throughput per queue  | 5,000 messages per second                                                                                                    | 500 messages per second                                              |
| Q-L09 | Consumer wall time    | 15 min ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/))                                        | 15 min per batch                                                     |
| Q-L10 | Consumer CPU time     | 30 s default, up to 5 min                                                                                                    | 30 s per batch                                                       |
| Q-L11 | Dead-letter retention | 4 days without a consumer ([dead letter queues](https://developers.cloudflare.com/queues/configuration/dead-letter-queues/)) | 4 days                                                               |

## 7. Errors

| Code                  | Retryable | When                                                                                       |
| --------------------- | --------- | ------------------------------------------------------------------------------------------ |
| `Q_MESSAGE_TOO_LARGE` | no        | A body over Q-L01, or a batch over Q-L02.                                                  |
| `Q_BODY_INVALID`      | no        | A body that is not JSON-serialisable (a `Date`, a `Map`, a cycle, `undefined` at the top). |
| `Q_DELAY_INVALID`     | no        | `delaySeconds` outside Q-L03.                                                              |
| `Q_RATE_LIMITED`      | yes       | Over Q-L08 ("Too Many Requests" on Cloudflare).                                            |
| `Q_NOT_DECLARED`      | no        | A send from a tool without `resources.queue` (also a build error).                         |
| `Q_UNAVAILABLE`       | yes       | The provider could not store the message; it may have been stored.                         |

A handler's own failure is not a contract error: it is a retry, and in the end a dead letter, logged with the handler, the event and `attempts`.

## 8. Conformance

| Case   | Proves         | What it does                                                                                       |
| ------ | -------------- | -------------------------------------------------------------------------------------------------- |
| Q-01.a | Q-01           | send 1,000 messages; the consumer acks all; each id is seen at least once                          |
| Q-02.a | Q-02           | Anvil: kill right after `send` resolves, restart, the message is delivered                         |
| Q-03.a | Q-03           | a `sendBatch` with one oversized message stores none                                               |
| Q-04.a | Q-04           | ack message 1, throw on message 2: only 2 comes back                                               |
| Q-05.a | Q-05           | throw without acks: the whole batch comes back, `attempts` 2                                       |
| Q-06.a | Q-06           | always throw: after 3 retries the message is in the dead-letter queue, readable for 4 days         |
| Q-07.a | Q-07           | `delaySeconds: 30` is not delivered before 30 s; same with `retry({ delaySeconds })`               |
| Q-08.a | Q-08           | `attempts` counts 1, 2, 3                                                                          |
| Q-09.a | Q-09           | the id is the same on a redelivery                                                                 |
| Q-10.a | Q-10           | an action that throws after `ctx.emit` sends nothing; one that succeeds sends once                 |
| Q-11.a | Q-11           | two tools and two channels: each consumer sees only its own                                        |
| Q-L.a  | Q-L01–L04, L08 | at each limit succeeds; over it fails with the listed code                                         |
| Q-N.a  | Q-N1–N5        | Anvil dev: out-of-order, duplicate, odd-sized and concurrent batches each happen in 1,000 messages |

## 9. Open questions

1. **Do tools get a queue of their own, or only `queue` events?** Recommendation: events only in `queue@1`. One queue per tool and channel, the runtime's envelope, one message per handler delivery. A raw `ctx.queue.send` can come later without changing the contract.
2. **One Cloudflare queue per channel.** Every branch's temporary channel would get its own queue, its own consumer and its own dead-letter queue; queues are plentiful (10,000 per account by default) but each is a provisioning step and a teardown. Recommendation: do it, named `<worker>--queue` and `<worker>--dlq`, created in `provision` and removed in `teardown` like the others, so Q-11 holds without a shared queue that filters by channel.
3. **Outbox.** Q-N6 loses an event when the Worker dies between the commit and the send. Recommendation: in `queue@1` accept it and say so; then write the event into an `_forgeron_outbox` table in the action's batch (D-012, with FOR-16) and send from it, which `@forgeron/bridges` needs anyway (reframing §4.2).
4. **Retention.** 14 days on Paid, 24 h on Free. Recommendation: the contract promises 24 h before a first attempt, and Anvil keeps messages 14 days.
5. **Until it is built.** Today a `queue` handler runs inside the request. Recommendation: either refuse `resources.queue` at build until the provider exists (honest), or keep the in-process path but make it a documented fallback of the local and test platforms only; never let a deployed tool run it silently.
