import type { Engine } from "./engine";
import { errorResponse } from "./http";
import type { Interface, Manifest, User } from "./types";

// `GET|POST /api/<action>` for the API, `POST /_f/call/<action>` for the views (sdk.md §7, §11).
// A GET reads its input from the query string, as strings; a POST reads a JSON object.

async function readInput(request: Request): Promise<{ input: unknown } | { error: Response }> {
  if (request.method === "GET") {
    return { input: Object.fromEntries(new URL(request.url).searchParams) };
  }
  const text = await request.text();
  if (!text.trim()) return { input: {} };
  try {
    return { input: JSON.parse(text) };
  } catch {
    return { error: errorResponse({ code: "INVALID", message: "The body is not valid JSON." }) };
  }
}

export async function handleCall(
  request: Request,
  engine: Engine,
  manifest: Manifest,
  user: User,
  via: Extract<Interface, "api" | "web">,
  action: string,
): Promise<Response> {
  const entry = manifest.actions[action];
  const expected = via === "api" ? (entry?.http.method ?? request.method) : "POST";
  if (request.method !== expected) {
    return Response.json(
      { error: { code: "METHOD_NOT_ALLOWED", message: `Use ${expected} for "${action}".` } },
      { status: 405, headers: { allow: expected } },
    );
  }
  const read = await readInput(request);
  if ("error" in read) return read.error;

  const outcome = await engine.invoke(user, via, action, read.input);
  return outcome.ok ? Response.json(outcome.result ?? null) : errorResponse(outcome.error);
}
