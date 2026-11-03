import { errorPage } from "../pages/errors";
import { linkButton, notice, page, paragraph, prefersHtml } from "../pages/shell";
import { ConsentError, type AuditEntry, type Consent, type Registry } from "@forgeron/registry";

// The consent routes of a delegated connector (docs/sdk.md section 10). Any signed-in person may
// call them, for themselves:
//   GET /api/tools/<tool>/environments/<env>/consent/<name>   -> 302 to the provider, `<name>` being
//       the key of `resources.connectors` in the tool's latest version
//   GET /api/consent/callback?state=…&code=…                  -> keeps the tokens
//   GET    /api/tools/<tool>/environments/<env>/consent        -> the person's own consents (no token)
//   DELETE /api/tools/<tool>/environments/<env>/consent/<name> -> the person withdraws their consent
// The scopes asked come from what the tool declared, never from the request.

const START =
  /^\/api\/tools\/([a-z0-9-]+)\/environments\/(preview|production)\/consent\/([a-z][a-z0-9-]*)$/;
const MINE =
  /^\/api\/tools\/([a-z0-9-]+)\/environments\/(preview|production)\/consent(?:\/([a-z][a-z0-9-]*))?$/;
const CALLBACK = "/api/consent/callback";

export interface ConsentRoutesOptions {
  registry: Registry;
  consent: Consent;
  /** Records a grant or a withdrawal (D-048). Defaults to the registry's audit log. */
  audit?(entry: AuditEntry): Promise<void>;
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

async function declaredConnector(
  registry: Registry,
  toolId: string,
  name: string,
): Promise<DeclaredConnector | undefined> {
  const latest = (await registry.listVersions(toolId)).at(-1);
  const build = latest ? await registry.getBuild(latest.buildId) : undefined;
  return (
    build?.manifest as { resources?: { connectors?: Record<string, DeclaredConnector> } } | null
  )?.resources?.connectors?.[name];
}

// One `access` line per grant and per withdrawal: who, which tool, environment and connector type;
// never a token. An audit failure never blocks the person.
async function audit(
  options: ConsentRoutesOptions,
  entry: { toolId: string; actor: string; subject: string; detail: Record<string, unknown> },
): Promise<void> {
  await (options.audit ?? ((e) => options.registry.recordAudit(e)))({
    ...entry,
    interface: "api",
    kind: "access",
  }).catch(() => undefined);
}

/** Answers a consent route, or `undefined` when the request is for another route. */
export async function handleConsent(
  request: Request,
  options: ConsentRoutesOptions,
): Promise<Response | undefined> {
  const answered = await consentRoutes(request, options);
  // A person who follows the provider's redirect sees a page, not a JSON error.
  if (!answered || answered.status < 400 || request.method !== "GET" || !prefersHtml(request)) {
    return answered;
  }
  const body = (await answered
    .clone()
    .json()
    .catch(() => undefined)) as { message?: unknown } | undefined;
  return errorPage(answered.status, {
    workspace: options.workspace,
    ...(typeof body?.message === "string" ? { detail: body.message } : {}),
    ...(answered.headers.get("retry-after")
      ? { headers: { "retry-after": answered.headers.get("retry-after")! } }
      : {}),
  });
}

async function consentRoutes(
  request: Request,
  options: ConsentRoutesOptions,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  const start = START.exec(url.pathname);
  const mine = MINE.exec(url.pathname);
  if (!start && !mine && url.pathname !== CALLBACK) return undefined;
  const ownList = mine !== null && mine[3] === undefined && request.method === "GET";
  const withdraw = mine !== null && mine[3] !== undefined && request.method === "DELETE";
  if (request.method !== "GET" && !withdraw) return json(405, { error: "METHOD_NOT_ALLOWED" });

  const caller = await options.caller(request);
  if (!caller) return json(401, { error: "UNAUTHENTICATED" });

  if (ownList || withdraw) {
    const [, toolName, environment, name] = mine as unknown as [
      string,
      string,
      "preview" | "production",
      string | undefined,
    ];
    const tool = await options.registry.findTool(options.workspace, toolName);
    if (!tool) return json(404, { error: "NOT_FOUND", message: `There is no tool ${toolName}.` });
    if (ownList) {
      return json(200, {
        connections: await options.registry.listConnections(tool.id, environment, {
          userId: caller.id,
        }),
      });
    }
    const declared = await declaredConnector(options.registry, tool.id, name!);
    if (!declared) {
      return json(404, {
        error: "NOT_FOUND",
        message: `${toolName} declares no connector ${name}.`,
      });
    }
    const revoked = await options.registry.revokeConnection({
      toolId: tool.id,
      environment,
      userId: caller.id,
      connector: declared.type,
    });
    if (revoked) {
      await audit(options, {
        toolId: tool.id,
        actor: caller.id,
        subject: `connector-consent:${declared.type}:withdraw`,
        detail: { environment, connector: name },
      });
    }
    return revoked
      ? new Response(null, { status: 204 })
      : json(404, { error: "NOT_FOUND", message: "You have not consented to that." });
  }

  try {
    if (!start) {
      const state = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      if (!state || !code) {
        return json(400, { error: "INVALID", message: "`state` and `code` are required." });
      }
      const done = await options.consent.complete({ state, code, userId: caller.id });
      await audit(options, {
        toolId: done.toolId,
        actor: caller.id,
        subject: `connector-consent:${done.connector}:grant`,
        detail: { environment: done.environment },
      });
      if (prefersHtml(request)) {
        return page(
          { title: "Connected", eyebrow: "Connector", workspace: options.workspace },
          notice("success", `${done.connector} is connected to your account.`) +
            paragraph("You can close this tab and go back to your work.", "lead") +
            linkButton("Open the workspace", "/", true),
        );
      }
      return json(200, { connected: true, connector: done.connector });
    }

    const [, toolName, environment, name] = start as unknown as [
      string,
      string,
      "preview" | "production",
      string,
    ];
    const tool = await options.registry.findTool(options.workspace, toolName);
    if (!tool) return json(404, { error: "NOT_FOUND", message: `There is no tool ${toolName}.` });
    const declared = await declaredConnector(options.registry, tool.id, name);
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
      // The provider failed to answer: nothing was lost, the person can try again.
      if (error.code === "PROVIDER_UNAVAILABLE") {
        return new Response(
          JSON.stringify({ error: error.code, message: error.message, retryable: true }),
          {
            status: 502,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
              "retry-after": "30",
            },
          },
        );
      }
      const status = error.code === "UNKNOWN_CONNECTOR" ? 404 : 400;
      return json(status, { error: error.code, message: error.message });
    }
    throw error;
  }
}
