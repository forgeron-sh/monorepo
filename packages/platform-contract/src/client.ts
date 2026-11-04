import type { z } from "zod";
import type { RouteSpec } from "./route";

// A typed client derived from the route objects alone: no app type, no handler, no codegen.
// The console and the CLI each hand in their own `fetch` (same-origin cookie, or a Bearer token).

type Json<C> = C extends { content: { "application/json": { schema: infer S extends z.ZodType } } }
  ? S
  : never;
type Params<R> = R extends { request: { params: infer P extends z.ZodType } }
  ? { params: z.input<P> }
  : unknown;
type Query<R> = R extends { request: { query: infer Q extends z.ZodType } }
  ? { query: z.input<Q> }
  : unknown;
type Body<R> = R extends { request: { body: infer B } }
  ? Json<B> extends infer S extends z.ZodType
    ? { json: z.input<S> }
    : unknown
  : unknown;

/** Every answer the route declares, told apart by `status`. */
export type Answer<R extends RouteSpec> = {
  [S in keyof R["responses"] & number]: {
    status: S;
    body: Json<R["responses"][S]> extends infer Z extends z.ZodType ? z.output<Z> : undefined;
  };
}[keyof R["responses"] & number];

export type CallInput<R extends RouteSpec> = Params<R> & Query<R> & Body<R>;

export function createClient(fetchImpl: typeof fetch, base: string) {
  return async function call<R extends RouteSpec>(
    route: R,
    ...[input]: keyof CallInput<R> extends never ? [] : [CallInput<R>]
  ): Promise<Answer<R>> {
    const { params, query, json } = (input ?? {}) as {
      params?: Record<string, string>;
      query?: Record<string, string | number | boolean | undefined>;
      json?: unknown;
    };
    const path = route.path.replace(/\{(\w+)\}/g, (_, key: string) =>
      encodeURIComponent(params?.[key] ?? ""),
    );
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) search.set(key, String(value));
    }
    const response = await fetchImpl(`${base}${path}${search.size ? `?${search}` : ""}`, {
      method: route.method.toUpperCase(),
      headers: {
        accept: "application/json",
        ...(json === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(json === undefined ? {} : { body: JSON.stringify(json) }),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined } as Answer<R>;
  };
}
