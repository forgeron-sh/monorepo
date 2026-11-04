import { createClient } from "@forgeron/platform-contract/client";

/** The gateway's API for the console. Same origin as the page: the session cookie goes with it, nowhere else. */
export const CONSOLE_API = "/console-api";

/** A failed call: the status, and what the platform said if it said anything. */
export class ApiError extends Error {
  override name = "ApiError";
  constructor(
    message: string,
    readonly status: number,
    /** What the platform said, when it said something: fit to show a person. */
    readonly detail?: string,
  ) {
    super(message);
  }
}

async function failure(path: string, response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => undefined)) as { message?: unknown } | undefined;
  const detail = typeof body?.message === "string" ? body.message : undefined;
  return new ApiError(
    `${path}: ${response.status}${detail ? ` ${detail}` : ""}`,
    response.status,
    detail,
  );
}

/**
 * The platform's typed client (`@forgeron/platform-contract`) over a screen's `fetchJson`: GET routes
 * only. A refusal still throws `ApiError`, so `explain` and every screen work as they did, and the
 * tests and the harness keep handing in their own `fetchJson`.
 */
export function typedClient(fetchJson: FetchJson) {
  return createClient(async (path) => Response.json(await fetchJson(String(path))), "");
}

/** The body of a route's `200`; any other status was thrown as `ApiError` by `fetchJson`. */
export function ok<A extends { status: number; body: unknown }>(
  answer: A,
): Extract<A, { status: 200 }>["body"] {
  if (answer.status !== 200)
    throw new ApiError(`Unexpected answer ${answer.status}`, answer.status);
  return answer.body;
}

export type FetchJson = (path: string) => Promise<unknown>;
export type SendJson = (
  path: string,
  body: unknown,
  method?: "PUT" | "POST" | "PATCH" | "DELETE",
) => Promise<unknown>;

/** What a screen needs of the platform; tests and the local harness hand in their own. */
export interface Api {
  fetchJson: FetchJson;
  sendJson: SendJson;
  /**
   * The platform's own routes on the workspace origin (`/promote`, `/rollback`, `/deploy`): the same
   * session answers there, they are not under `/console-api`. Absent where a screen does not need it.
   */
  sendPlatform?: SendPlatform;
}

type SendPlatform = (path: string, body: unknown, method?: "POST" | "DELETE") => Promise<unknown>;

/** What to tell a person about a failed call: what the platform said, else what to do. */
export function explain(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return "You are not allowed to do this. Ask an admin.";
    if (error.status === 401) return "Your session ended. Sign in again.";
    if (error.detail) return error.detail;
  }
  return fallback;
}

export async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(`${CONSOLE_API}${path}`, {
    credentials: "same-origin",
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw await failure(path, response);
  return response.json();
}

/** Writes JSON (`PUT` unless told otherwise); a `204` answers `undefined`. */
export async function sendJson(
  path: string,
  body: unknown,
  method: "PUT" | "POST" | "PATCH" | "DELETE" = "PUT",
): Promise<unknown> {
  const response = await fetch(`${CONSOLE_API}${path}`, {
    method,
    credentials: "same-origin",
    headers: { accept: "application/json", "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw await failure(path, response);
  return response.status === 204 ? undefined : response.json();
}

/** A call to one of the platform's routes; its refusals are `{ error: { code, message } }`. */
export async function sendPlatform(
  path: string,
  body: unknown,
  method: "POST" | "DELETE" = "POST",
): Promise<unknown> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const failed = (await response.json().catch(() => undefined)) as
      | { error?: { message?: unknown } }
      | undefined;
    const detail = typeof failed?.error?.message === "string" ? failed.error.message : undefined;
    throw new ApiError(
      `${path}: ${response.status}${detail ? ` ${detail}` : ""}`,
      response.status,
      detail,
    );
  }
  return response.json();
}
