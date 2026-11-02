import type { Interface } from "@forgeron/manifest";
import type { z } from "zod";
import type { Context } from "./context";

/** A standard level, or one specific to the tool. */
export type Access = "read" | "write" | "delete" | "admin" | (string & Record<never, never>);

export interface RateLimit {
  per: "user" | "tool";
  max: number;
  /** A duration such as `"1m"`. */
  window: string;
}

export interface ActionOptions<I extends z.ZodObject, O extends z.ZodType = z.ZodUnknown> {
  /** For Claude, OpenAPI and the CLI help: it is what makes Claude choose the action. */
  description: string;
  access: Access;
  input: I;
  output?: O;
  /** Destructive action. `true` by default when `access` is `"delete"`. */
  confirm?: boolean;
  /** Input fields passed as positional arguments. */
  cli?: { args?: Array<keyof z.output<I> & string> };
  /** `GET` by default when `access` is `"read"`, else `POST`. */
  http?: { method: "GET" | "POST" };
  /** Hides the action from some interfaces; those of the tool by default. */
  interfaces?: Interface[];
  rateLimit?: RateLimit;
  run(ctx: Context<z.output<I>>): z.output<O> | Promise<z.output<O>>;
}

export interface ActionDefinition<
  I extends z.ZodObject = z.ZodObject,
  O extends z.ZodType = z.ZodType,
> extends ActionOptions<I, O> {
  readonly kind: "action";
}

/** Declares an action: the unit exposed through MCP, API, CLI and Web. */
export function action<I extends z.ZodObject, O extends z.ZodType = z.ZodUnknown>(
  options: ActionOptions<I, O>,
): ActionDefinition<I, O> {
  if (typeof options.description !== "string" || !options.description.trim()) {
    throw new TypeError("An action needs a description.");
  }
  if (typeof options.access !== "string" || !options.access.trim()) {
    throw new TypeError("An action needs an access level.");
  }
  const fields = Object.keys(options.input.shape);
  for (const arg of options.cli?.args ?? []) {
    if (!fields.includes(arg)) {
      throw new TypeError(`cli.args cites "${arg}", which is not a field of the input.`);
    }
  }
  return { kind: "action", ...options };
}
