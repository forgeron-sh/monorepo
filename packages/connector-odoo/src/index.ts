import { defineConnector, ToolError, type Fetch } from "@forgeron/sdk";

// The Odoo connector (docs/sdk.md sections 10 and 18). Odoo is reached through its external API,
// `execute_kw` on `/jsonrpc`, with the database, the login and an API key (the session token).

export interface OdooInstance {
  /** Base address of the instance, https: `https://odoo.example.test`. */
  url: string;
  /** Name of the Odoo database. */
  db: string;
  /** Login (email) of the Odoo user the API key belongs to. */
  login: string;
}

export interface SearchReadOptions {
  fields?: string[];
  limit?: number;
  offset?: number;
  order?: string;
}

export interface OdooClient {
  /** `execute_kw` on any model and method. */
  call<T = unknown>(
    model: string,
    method: string,
    args?: unknown[],
    kwargs?: Record<string, unknown>,
  ): Promise<T>;
  searchRead<T = Record<string, unknown>>(
    model: string,
    domain?: unknown[],
    options?: SearchReadOptions,
  ): Promise<T[]>;
}

interface JsonRpcReply {
  result?: unknown;
  error?: { message?: string; data?: { message?: string } };
}

function baseUrl(instance: OdooInstance): URL {
  const url = new URL(instance.url);
  if (url.protocol !== "https:") throw new Error(`Odoo url must be https: "${instance.url}".`);
  return url;
}

function client(instance: OdooInstance, fetch: Fetch, token: () => Promise<string>): OdooClient {
  const endpoint = `${baseUrl(instance).origin}/jsonrpc`;
  async function call<T>(
    model: string,
    method: string,
    args: unknown[] = [],
    kwargs: Record<string, unknown> = {},
  ): Promise<T> {
    const key = await token();
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [instance.db, instance.login, key, model, method, args, kwargs],
        },
      }),
    });
    if (!response.ok) throw new ToolError("UPSTREAM", `Odoo answered ${response.status}.`);
    const body = (await response.json()) as JsonRpcReply;
    if (body.error) {
      throw new ToolError(
        "UPSTREAM",
        body.error.data?.message ?? body.error.message ?? "Odoo returned an error.",
      );
    }
    return body.result as T;
  }
  return {
    call,
    searchRead: (model, domain = [], options = {}) =>
      call(model, "search_read", [domain], { ...options }),
  };
}

/** The connector for one Odoo instance; the platform supplies the API key as the session token. */
export function odoo(instance: OdooInstance) {
  const host = baseUrl(instance).hostname;
  return defineConnector<OdooClient>({
    type: "odoo",
    hosts: [host],
    modes: ["delegated", "application"],
    scopes: [],
    client: (fetch, session) => client(instance, fetch, session.token),
  });
}
