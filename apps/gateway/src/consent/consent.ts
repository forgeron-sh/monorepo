import { ConsentError, type Consent, type Registry } from "@forgeron/registry";

// The consent routes of a delegated connector (docs/sdk.md section 10). Any signed-in person may
// call them, for themselves:
//   GET /api/tools/<tool>/environments/<env>/consent/<name>   -> 302 to the provider, `<name>` being
//       the key of `resources.connectors` in the tool's latest version
//   GET /api/consent/callback?state=…&code=…                  -> keeps the tokens
// The scopes asked come from what the tool declared, never from the request.

const START =
  /^\/api\/tools\/([a-z0-9-]+)\/environments\/(preview|pilot|production)\/consent\/([a-z][a-z0-9-]*)$/;
const CALLBACK = "/api/consent/callback";

export interface ConsentRoutesOptions {
  registry: Registry;
  consent: Consent;
  /** The workspace the request was dispatched to. */
  workspace: string;
  /** The signed-in person: `undefined` is anonymous. */
  caller(request: Request): Promise<{ id: string } | undefined>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

interface DeclaredConnector {
  type: string;
  mode: string;
  scopes: string[];
}

/** Answers a consent route, or `undefined` when the request is for another route. */
export async function handleConsent(
  request: Request,
  options: ConsentRoutesOptions,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  const start = START.exec(url.pathname);
  if (!start && url.pathname !== CALLBACK) return undefined;
  if (request.method !== "GET") return json(405, { error: "METHOD_NOT_ALLOWED" });

  const caller = await options.caller(request);
  if (!caller) return json(401, { error: "UNAUTHENTICATED" });

  try {
    if (!start) {
      const state = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      if (!state || !code) {
        return json(400, { error: "INVALID", message: "`state` and `code` are required." });
      }
      const done = await options.consent.complete({ state, code, userId: caller.id });
      return json(200, { connected: true, connector: done.connector });
    }

    const [, toolName, environment, name] = start as unknown as [
      string,
      string,
      "preview" | "pilot" | "production",
      string,
    ];
    const tool = await options.registry.findTool(options.workspace, toolName);
    if (!tool) return json(404, { error: "NOT_FOUND", message: `There is no tool ${toolName}.` });
    const latest = (await options.registry.listVersions(tool.id)).at(-1);
    const build = latest ? await options.registry.getBuild(latest.buildId) : undefined;
    const declared = (
      build?.manifest as { resources?: { connectors?: Record<string, DeclaredConnector> } } | null
    )?.resources?.connectors?.[name];
    if (!declared) {
      return json(404, {
        error: "NOT_FOUND",
        message: `${toolName} declares no connector ${name}.`,
      });
    }
    if (declared.mode !== "delegated") {
      return json(400, {
        error: "INVALID",
        message: "Only a delegated connector needs a person's consent.",
      });
    }
    const { url: providerUrl } = await options.consent.start({
      toolId: tool.id,
      environment,
      userId: caller.id,
      connector: declared.type,
      scopes: declared.scopes,
    });
    return new Response(null, {
      status: 302,
      headers: { location: providerUrl, "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ConsentError) {
      const status = error.code === "UNKNOWN_CONNECTOR" ? 404 : 400;
      return json(status, { error: error.code, message: error.message });
    }
    throw error;
  }
}
