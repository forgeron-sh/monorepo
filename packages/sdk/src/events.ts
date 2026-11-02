import type { Context, Environment, Fetch, Logger, User } from "./context";

export type EventMode = "sync" | "queue";

/** What an event handler receives (docs/sdk.md section 9). */
export interface EventContext<Payload = unknown> {
  payload: Payload;
  user: User;
  emit: Context["emit"];
  secrets: Context["secrets"];
  fetch: Fetch;
  log: Logger;
  now(): Date;
  env: Environment;
}

export interface EventOptions {
  /** `"sync"` runs inside the action's transaction; `"queue"` runs after it is committed. */
  mode?: EventMode;
}

export interface EventDefinition<Payload = unknown> {
  readonly kind: "event";
  event: string;
  mode: EventMode;
  handler(ctx: EventContext<Payload>): void | Promise<void>;
}

export interface ScheduleOptions {
  /** An IANA time zone; the workspace's by default. */
  timezone?: string;
}

export interface JobDefinition {
  readonly kind: "job";
  cron: string;
  timezone?: string;
  handler(ctx: Context<undefined>): void | Promise<void>;
}

// `group.past`, like `deal.moved`.
const EVENT_NAME = /^[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*$/;
const CRON_FIELD = /^[0-9A-Za-z*/,\-?]+$/;

type EventHandler<Payload> = EventDefinition<Payload>["handler"];

/** Declares a handler for an event emitted with `ctx.emit`. */
export function on<Payload = unknown>(
  event: string,
  handler: EventHandler<Payload>,
): EventDefinition<Payload>;
export function on<Payload = unknown>(
  event: string,
  options: EventOptions,
  handler: EventHandler<Payload>,
): EventDefinition<Payload>;
export function on<Payload>(
  event: string,
  optionsOrHandler: EventOptions | EventHandler<Payload>,
  maybeHandler?: EventHandler<Payload>,
): EventDefinition<Payload> {
  const options = typeof optionsOrHandler === "function" ? {} : optionsOrHandler;
  const handler = typeof optionsOrHandler === "function" ? optionsOrHandler : maybeHandler;
  if (!handler) throw new TypeError(`The handler of "${event}" is missing.`);
  if (!EVENT_NAME.test(event)) {
    throw new TypeError(`"${event}" is not an event name: use group.past, like deal.moved.`);
  }
  return { kind: "event", event, mode: options.mode ?? "sync", handler };
}

/** Declares a scheduled task, run with the identity of the tool. */
export function schedule(cron: string, handler: JobDefinition["handler"]): JobDefinition;
export function schedule(
  cron: string,
  options: ScheduleOptions,
  handler: JobDefinition["handler"],
): JobDefinition;
export function schedule(
  cron: string,
  optionsOrHandler: ScheduleOptions | JobDefinition["handler"],
  maybeHandler?: JobDefinition["handler"],
): JobDefinition {
  const options = typeof optionsOrHandler === "function" ? {} : optionsOrHandler;
  const handler = typeof optionsOrHandler === "function" ? optionsOrHandler : maybeHandler;
  if (!handler) throw new TypeError(`The handler of the task "${cron}" is missing.`);
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5 || !fields.every((field) => CRON_FIELD.test(field))) {
    throw new TypeError(`"${cron}" is not a cron expression with five fields.`);
  }
  return options.timezone === undefined
    ? { kind: "job", cron, handler }
    : { kind: "job", cron, timezone: options.timezone, handler };
}
