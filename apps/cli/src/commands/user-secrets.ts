import type { Io } from "../io";

// A person's own secrets (`resources.userSecrets`, sdk.md §10, D-034). The CLI types them in the
// terminal, hidden, and sends them to the gateway at `/t/<tool>/secrets`: the value is never an
// argument, never printed, and the gateway keeps it sealed for that person and tool only.

/** What a tool's `428 SECRET_REQUIRED` says is missing. */
export interface MissingSecret {
  name: string;
  label: string;
  help?: string;
  why: string;
}

/** The `details` of a `428` answer, if `body` is one. */
export function missingSecretsOf(body: unknown): MissingSecret[] | undefined {
  const error = (body as { error?: { code?: unknown; details?: { missing?: unknown } } } | null)
    ?.error;
  if (error?.code !== "SECRET_REQUIRED" || !Array.isArray(error.details?.missing)) return undefined;
  return error.details.missing as MissingSecret[];
}

/**
 * Asks for each secret in the terminal and stores it. Returns `false` when nothing was entered
 * (empty value, or nobody to ask); a tool command then exits with 1 and prints the link.
 */
export async function promptUserSecrets(
  io: Io,
  target: { endpoint: string; tool: string; token: string },
  missing: MissingSecret[],
): Promise<boolean> {
  if (!io.readSecret) return false;
  const values: Record<string, string> = {};
  for (const secret of missing) {
    io.log(`${secret.label}: ${secret.why}${secret.help ? ` (${secret.help})` : ""}`);
    const value = await io.readSecret(`${secret.label}: `);
    if (value === "") return false;
    values[secret.name] = value;
  }
  const response = await fetch(`${target.endpoint.replace(/\/+$/, "")}/t/${target.tool}/secrets`, {
    method: "POST",
    headers: { authorization: `Bearer ${target.token}`, "content-type": "application/json" },
    body: JSON.stringify(values),
  });
  if (!response.ok) {
    throw new Error(`The workspace refused your secrets (${response.status}).`);
  }
  io.log(`Saved ${missing.map((s) => s.name).join(", ")}.`);
  return true;
}
