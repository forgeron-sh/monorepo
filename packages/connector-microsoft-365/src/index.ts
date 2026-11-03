import { defineConnector, ToolError, type Fetch, type FetchResponse } from "@forgeron/sdk";

// The Microsoft 365 connector (docs/sdk.md sections 10 and 18): a thin Microsoft Graph client over
// the authenticated `fetch` the platform lends, limited to `graph.microsoft.com`.

export const GRAPH_URL = "https://graph.microsoft.com/v1.0";

/** Graph permissions a tool may ask for. */
export const MICROSOFT_365_SCOPES = [
  "User.Read",
  "Mail.Read",
  "Mail.ReadWrite",
  "Mail.Send",
  "Calendars.Read",
  "Calendars.ReadWrite",
  "Contacts.Read",
  "Contacts.ReadWrite",
  "Files.Read",
  "Files.ReadWrite",
  "Sites.Read.All",
  "Sites.ReadWrite.All",
] as const;

export interface GraphClient {
  /** `path` is relative to `/v1.0` (`/me/messages`) or an absolute Graph URL. */
  get<T = unknown>(path: string): Promise<T>;
  post<T = unknown>(path: string, body?: unknown): Promise<T>;
  patch<T = unknown>(path: string, body?: unknown): Promise<T>;
  delete(path: string): Promise<void>;
  /** Every item of a collection, following `@odata.nextLink`. */
  list<T = unknown>(path: string): Promise<T[]>;
}

export interface Microsoft365Client {
  graph: GraphClient;
}

function failure(response: FetchResponse, text: string): ToolError {
  let message = `Microsoft Graph answered ${response.status}.`;
  try {
    const body = JSON.parse(text) as { error?: { message?: string } };
    if (body.error?.message) message = body.error.message;
  } catch {
    // not JSON: keep the generic message
  }
  const code =
    response.status === 404
      ? "NOT_FOUND"
      : response.status === 401 || response.status === 403
        ? "FORBIDDEN"
        : response.status === 429
          ? "RATE_LIMITED"
          : "UPSTREAM";
  return new ToolError(code, message);
}

function graph(fetch: Fetch): GraphClient {
  const url = (path: string) => (path.startsWith("https://") ? path : `${GRAPH_URL}${path}`);
  async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(url(path), {
      method,
      ...(body === undefined
        ? {}
        : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
    });
    const text = await response.text();
    if (!response.ok) throw failure(response, text);
    return (text === "" ? undefined : JSON.parse(text)) as T;
  }
  return {
    get: (path) => send("GET", path),
    post: (path, body) => send("POST", path, body),
    patch: (path, body) => send("PATCH", path, body),
    delete: async (path) => {
      await send("DELETE", path);
    },
    async list<T>(path: string) {
      const items: T[] = [];
      let next: string | undefined = path;
      while (next) {
        const page: { value?: T[]; "@odata.nextLink"?: string } = await send("GET", next);
        items.push(...(page.value ?? []));
        next = page["@odata.nextLink"];
      }
      return items;
    },
  };
}

export const microsoft365 = defineConnector<Microsoft365Client>({
  type: "microsoft-365",
  hosts: ["graph.microsoft.com"],
  modes: ["delegated", "application"],
  scopes: MICROSOFT_365_SCOPES,
  client: (fetch) => ({ graph: graph(fetch) }),
});
