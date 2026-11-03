import { actionAddresses } from "@forgeron/manifest";
import type { Engine } from "./engine";
import type { Manifest, User } from "./types";

// MCP over Streamable HTTP, answered as plain JSON (no stream): initialize, ping,
// tools/list and tools/call. Tool names are `<tool>_<group>_<verb>` (sdk.md §7).

const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

// URL-mode elicitation (MCP 2025-11-25): the only mode meant for a secret, because the value is
// typed in the browser and never crosses the MCP client. The runtime answers over plain JSON with
// no session, so it cannot ask in the middle of a call: it answers the call with this error, and
// a client that knows it opens the URL and calls again. The earlier versions get the link in the
// text of the tool error (D-036).
const URL_ELICITATION_REQUIRED = -32042;
const URL_ELICITATION_VERSION = "2025-11-25";

type Id = string | number | null;

interface RpcRequest {
  jsonrpc?: unknown;
  id?: Id;
  method?: unknown;
  params?: Record<string, unknown>;
}

const reply = (id: Id, result: unknown) => ({ jsonrpc: "2.0", id, result });
const rpcError = (id: Id, code: number, message: string) => ({
  jsonrpc: "2.0",
  id,
  error: { code, message },
});

export const toolName = (tool: string, action: string): string => actionAddresses(tool, action).mcp;

async function handleMessage(
  message: RpcRequest,
  engine: Engine,
  manifest: Manifest,
  user: User,
  protocolVersion: string | null,
): Promise<object | undefined> {
  const id = message.id ?? null;
  // A message without an id is a notification: it gets no answer.
  const isNotification = message.id === undefined;
  if (message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return rpcError(id, -32600, "Invalid request.");
  }

  switch (message.method) {
    case "initialize": {
      const asked = message.params?.protocolVersion;
      const version = SUPPORTED_VERSIONS.find((v) => v === asked) ?? SUPPORTED_VERSIONS[0];
      return reply(id, {
        protocolVersion: version,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: manifest.name, title: manifest.title, version: manifest.version },
        instructions: manifest.description,
      });
    }
    case "ping":
      return reply(id, {});
    case "tools/list": {
      // Only what the person may call: Claude sees what they would see.
      const tools = engine.list(user, "mcp").map(({ name, entry }) => ({
        name: toolName(manifest.name, name),
        description: entry.description,
        inputSchema: entry.input,
        ...(entry.output?.type === "object" ? { outputSchema: entry.output } : {}),
        annotations: {
          readOnlyHint: entry.access === "read",
          destructiveHint: entry.confirm,
        },
      }));
      return reply(id, { tools });
    }
    case "tools/call": {
      const wanted = message.params?.name;
      const action = Object.keys(manifest.actions).find(
        (name) => toolName(manifest.name, name) === wanted,
      );
      if (!action) return rpcError(id, -32602, `Unknown tool "${String(wanted)}".`);
      const outcome = await engine.invoke(user, "mcp", action, message.params?.arguments);
      if (!outcome.ok && outcome.error.code === "SECRET_REQUIRED") {
        const inputUrl = (outcome.error.details as { inputUrl?: unknown } | undefined)?.inputUrl;
        // A date-named version compares as text.
        if (
          typeof inputUrl === "string" &&
          protocolVersion !== null &&
          protocolVersion >= URL_ELICITATION_VERSION
        ) {
          return {
            jsonrpc: "2.0",
            id,
            error: {
              code: URL_ELICITATION_REQUIRED,
              message: outcome.error.message,
              data: {
                elicitations: [
                  {
                    mode: "url",
                    elicitationId: crypto.randomUUID(),
                    url: inputUrl,
                    message: outcome.error.message,
                  },
                ],
              },
            },
          };
        }
      }
      if (!outcome.ok) {
        return reply(id, {
          content: [{ type: "text", text: `${outcome.error.code}: ${outcome.error.message}` }],
          isError: true,
        });
      }
      const { result } = outcome;
      const structured = typeof result === "object" && result !== null && !Array.isArray(result);
      return reply(id, {
        content: [{ type: "text", text: JSON.stringify(result ?? null) }],
        ...(structured ? { structuredContent: result } : {}),
        isError: false,
      });
    }
    default:
      if (message.method.startsWith("notifications/") || isNotification) return undefined;
      return rpcError(id, -32601, `Method not found: ${message.method}.`);
  }
}

export async function handleMcp(
  request: Request,
  engine: Engine,
  manifest: Manifest,
  user: User,
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(rpcError(null, -32700, "Parse error."), { status: 400 });
  }

  const version = request.headers.get("mcp-protocol-version");
  if (Array.isArray(body)) {
    const answers = (
      await Promise.all(
        body.map((m) => handleMessage(m as RpcRequest, engine, manifest, user, version)),
      )
    ).filter((a) => a !== undefined);
    return answers.length ? Response.json(answers) : new Response(null, { status: 202 });
  }
  const answer = await handleMessage((body ?? {}) as RpcRequest, engine, manifest, user, version);
  return answer ? Response.json(answer) : new Response(null, { status: 202 });
}
