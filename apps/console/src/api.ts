/** The gateway's API for the console. Same origin as the page: the session cookie goes with it, nowhere else. */
export const CONSOLE_API = "/console-api";

export async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(`${CONSOLE_API}${path}`, {
    credentials: "same-origin",
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}
