/** The gateway's API for the console. Same origin as the page: the session cookie goes with it, nowhere else. */
export const CONSOLE_API = "/console-api";

/** A failed call: the status, and what the platform said if it said anything. */
async function failure(path: string, response: Response): Promise<Error> {
  const body = (await response.json().catch(() => undefined)) as { message?: unknown } | undefined;
  return new Error(
    `${path}: ${response.status}${typeof body?.message === "string" ? ` ${body.message}` : ""}`,
  );
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
