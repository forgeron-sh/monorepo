import type { ViewBootstrap } from "@forgeron/runtime";
import type { ViewParamsStore, ViewRuntime } from "./client";

// The runtime of a view in the browser: its actions go through `/_f/call/<action>` of its tool,
// with the short-lived token the gateway put in the page (sdk.md §7, Isolation point 3). The
// token is bound to this tool and this person: another tool's API refuses it.

export interface HttpRuntimeOptions {
  /** The page's URL parameters; in the browser, a store over `location.search`. */
  params: ViewParamsStore;
  fetch?: (url: string, init: RequestInit) => Promise<Response>;
  now?: () => Date;
}

/** A parameters store that lives in memory: for tests and for pages without a URL. */
export function createMemoryParams(initial: Record<string, string> = {}): ViewParamsStore {
  let current = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set(next) {
      current = next;
      for (const listener of [...listeners]) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

async function failureOf(response: Response): Promise<Error> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return new Error(body.error.message);
  } catch {
    // Not the runtime's error shape: fall through to the status.
  }
  return new Error(`The tool answered ${response.status}.`);
}

export function createHttpRuntime(
  bootstrap: ViewBootstrap,
  options: HttpRuntimeOptions,
): ViewRuntime {
  const send = options.fetch ?? ((url, init) => fetch(url, init));
  const now = options.now ?? (() => new Date());
  const grants = new Set(bootstrap.grants);
  const callable = new Set(bootstrap.callable ?? []);
  return {
    user: bootstrap.user,
    can: (level) => grants.has(level),
    // A page without `callable` predates the matrix for views: nothing is known, so nothing is shown as allowed.
    canCall: (action) => callable.has(action),
    params: options.params,
    async call(action, input) {
      if (now().getTime() / 1000 >= bootstrap.expiresAt) {
        throw new Error("This page has expired: reload it.");
      }
      const response = await send(`${bootstrap.base}/_f/call/${encodeURIComponent(action)}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${bootstrap.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(input ?? {}),
      });
      if (!response.ok) throw await failureOf(response);
      return response.json();
    },
  };
}
