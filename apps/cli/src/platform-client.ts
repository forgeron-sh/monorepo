import { createClient } from "@forgeron/platform-contract/client";

/**
 * The typed client of the platform API for a workspace's `endpoint`, with the caller's Bearer token
 * (a deployment token, or the one `forgeron login` stored). The routes and their answers come from
 * `@forgeron/platform-contract`; this entry takes no schema, so the CLI does not carry zod.
 */
export function platformClient(endpoint: string, token?: string) {
  return createClient(
    (input, init) =>
      fetch(input, {
        ...init,
        headers: {
          ...(init?.headers as Record<string, string>),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      }),
    endpoint.replace(/\/+$/, ""),
  );
}

/** The refusal's sentence, or what the status says, for a failed answer of these routes. */
export function refusal(answer: { status: number; body: unknown }): string {
  const message = (answer.body as { error?: { message?: unknown } } | undefined)?.error?.message;
  return typeof message === "string" ? message : `The workspace answered ${answer.status}.`;
}
