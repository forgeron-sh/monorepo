import type { PlatformPermission } from "@forgeron/permissions";
import type { z } from "zod";

// What a tool is, shared by the tools of the admin MCP (`tools.ts`, `tools-admin.ts`).

/** What a tool asks of the caller (D-137): any signed-in person, or one platform permission. */
export type Requires = PlatformPermission | "signed-in";

/** What a tool may ask of the platform: one of its routes, answered as it would to the console. */
export interface PlatformCall {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  /** `console` for `/console-api/…` routes (the default), `root` for `/rollback`. */
  surface?: "console" | "root";
}
export type PlatformPort = (call: PlatformCall) => Promise<{ status: number; body: unknown }>;

/** A refusal the person should read: the platform said no, or the request names nothing real. */
export class ToolRefusal extends Error {}

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  /** Who may call it, and is offered it: the platform checks the same again when the tool calls a route. */
  requires: Requires;
  /** A tool that changes something carries the MCP `destructiveHint`: the client asks first. */
  destructive: boolean;
  input: z.ZodObject;
  run(args: never, port: PlatformPort): Promise<unknown>;
}
