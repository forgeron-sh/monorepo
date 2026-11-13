import { z } from "zod";
import { holds, PLATFORM } from "@forgeron/permissions";
import type { Person } from "../kernel/person";
import { TOOLS, ToolRefusal, type PlatformPort, type ToolDefinition } from "./tools";

// The admin MCP at `/mcp` (sdk.md §17, D-079): Streamable HTTP in its simplest form, one JSON
// answer per POST, no session and no stream. The caller is the person the gateway authenticated
// (`person`), and their permissions are read from them: no tool takes a person to act as. The
// permission a tool requires is checked here, before the call, and again by the platform's own guard
// when the tool calls the route, so a tool listed wrongly still cannot do more than the console lets
// the person do (D-136).

const VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
export interface AdminMcpContext {
  /** Who the gateway authenticated for this request; `undefined` for nobody. */
  person(): Promise<Person | undefined>;
  /** The platform's routes, called as that person. */
  platform: PlatformPort;
}

const mayCall = (person: Person, tool: ToolDefinition) =>
  tool.requires === "signed-in" || holds(PLATFORM, person.permissions, tool.requires);

/** Who a tool is for, in words: what the listing says and what a refusal says. */
const forWhom = (tool: ToolDefinition) =>
  tool.requires === "signed-in"
    ? "any signed-in person"
    : `people who hold the permission \u201c${PLATFORM.permissions[tool.requires].label}\u201d`;

/** Keys that hold a secret whatever the route: blanked in every answer, a second lock. */
const SECRET_KEY = /^(value|secret|password|token|clientSecret|apiKey|authorization)$/i;

/** The answer of a route with any secret-looking field blanked. No route returns one on purpose. */
export function redacted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redacted);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [
        key,
        SECRET_KEY.test(key) ? "[redacted]" : redacted(inner),
      ]),
    );
  }
  return value;
}

const message = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
});

const reply = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });
const failure = (id: string | number | null, code: number, text: string) =>
  reply({ jsonrpc: "2.0", id, error: { code, message: text } });

/** What a client is shown of a tool: its schema, and the annotations that make it ask first. */
function described(tool: ToolDefinition) {
  return {
    name: tool.name,
    title: tool.title,
    description: `${tool.description} For ${forWhom(tool)}.`,
    inputSchema: z.toJSONSchema(tool.input, { io: "input" }),
    annotations: {
      title: tool.title,
      readOnlyHint: !tool.destructive,
      destructiveHint: tool.destructive,
      idempotentHint: !tool.destructive,
      openWorldHint: false,
    },
  };
}

const text = (data: unknown, isError = false) => ({
  content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data) }],
  ...(isError ? { isError: true } : {}),
});

export function createAdminMcp(context: AdminMcpContext) {
  return async function handle(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return reply({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST." } }, 405, {
        allow: "POST",
      });
    }
    const person = await context.person();
    if (!person) {
      return reply(
        {
          error: {
            code: "UNAUTHENTICATED",
            message:
              "Send a token of this workspace as a Bearer: from `forgeron login`, or from OAuth (see the resource metadata).",
          },
        },
        401,
        {
          // RFC 9728: where an MCP client finds the authorization server (D-094).
          "www-authenticate": `Bearer resource_metadata="${new URL(request.url).origin}/.well-known/oauth-protected-resource"`,
        },
      );
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return failure(null, -32700, "The body is not JSON.");
    }
    const parsed = message.safeParse(raw);
    if (!parsed.success) return failure(null, -32600, "Send one JSON-RPC 2.0 message.");
    const { id, method, params = {} } = parsed.data;
    // A notification has no answer.
    if (id === undefined) return new Response(null, { status: 202 });

    switch (method) {
      case "initialize": {
        const asked = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
        return reply({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0],
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: "forgeron", title: "Forgeron" },
          },
        });
      }
      case "ping":
        return reply({ jsonrpc: "2.0", id, result: {} });
      case "tools/list":
        // Only what this person may call: a tool is listed only to those who hold its permission.
        return reply({
          jsonrpc: "2.0",
          id,
          result: { tools: TOOLS.filter((t) => mayCall(person, t)).map(described) },
        });
      case "tools/call": {
        const tool = TOOLS.find((t) => t.name === params.name);
        if (!tool) return failure(id, -32602, `There is no tool ${String(params.name)}.`);
        if (!mayCall(person, tool)) {
          return reply({
            jsonrpc: "2.0",
            id,
            result: text(`403 FORBIDDEN: ${tool.name} is for ${forWhom(tool)}.`, true),
          });
        }
        const args = tool.input.safeParse(params.arguments ?? {});
        if (!args.success) {
          return reply({
            jsonrpc: "2.0",
            id,
            result: text(
              `400 INVALID: ${args.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ")}`,
              true,
            ),
          });
        }
        try {
          const data = await tool.run(args.data as never, context.platform);
          return reply({ jsonrpc: "2.0", id, result: text(redacted(data)) });
        } catch (error) {
          if (error instanceof ToolRefusal) {
            return reply({ jsonrpc: "2.0", id, result: text(error.message, true) });
          }
          // Anything else is the platform's failure: nothing of it reaches the client.
          console.error("admin MCP tool failed", tool.name);
          return reply({ jsonrpc: "2.0", id, result: text("500 FAILED: the call failed.", true) });
        }
      }
      default:
        return failure(id, -32601, `Method not found: ${method}.`);
    }
  };
}
