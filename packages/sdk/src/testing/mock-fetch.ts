import type { Fetch, FetchInit, FetchResponse } from "../context";

export interface MockRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
  /** The body, parsed as JSON. */
  json(): unknown;
}

class MockReply {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {}
}

/** A route that answers with another status than 200: `reply(404, { error: "not found" })`. */
export function reply(status: number, body?: unknown): MockReply {
  return new MockReply(status, body);
}

/** A body, a `reply(...)`, or a function of the request that returns either. */
export type MockRoute =
  | ((request: MockRequest) => unknown)
  | MockReply
  | object
  | string
  | number
  | boolean
  | null;

export type MockFetch = Fetch & {
  /** Every call that was made, in order. */
  calls: MockRequest[];
};

function respond(result: unknown): FetchResponse {
  const { status, body } = result instanceof MockReply ? result : { status: 200, body: result };
  const text = typeof body === "string" ? body : JSON.stringify(body ?? null);
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => (text === "" ? undefined : JSON.parse(text)),
    text: async () => text,
  };
}

/**
 * Simulates the upstreams of a tool. Routes are keyed `"METHOD url"`; a call that no route
 * matches fails, so a test never reaches the network by accident.
 */
export function mockFetch(routes: Record<string, MockRoute>): MockFetch {
  const calls: MockRequest[] = [];
  const fetch = async (url: string, init: FetchInit = {}): Promise<FetchResponse> => {
    const method = (init.method ?? "GET").toUpperCase();
    const request: MockRequest = {
      url,
      method,
      headers: init.headers ?? {},
      body: init.body,
      json: () => (init.body === undefined ? undefined : JSON.parse(init.body)),
    };
    calls.push(request);

    // An exact match first, then the same address without its query string.
    const bare = url.split("?")[0]!;
    const key = [`${method} ${url}`, `${method} ${bare}`].find((k) => k in routes);
    if (key === undefined) {
      const known = Object.keys(routes).join(", ") || "none";
      throw new Error(`mockFetch: no route for "${method} ${url}" (routes: ${known}).`);
    }
    const route = routes[key];
    return respond(typeof route === "function" ? await route(request) : route);
  };
  return Object.assign(fetch, { calls });
}
