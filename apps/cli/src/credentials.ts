import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

// A person's credentials are never in the project (sdk.md §4): `forgeron login` stores them in
// `~/.config/forgeron/credentials`. `XDG_CONFIG_HOME` moves the folder, as it does for other tools.

const credentialsFile = (env: NodeJS.ProcessEnv = process.env) =>
  join(env.XDG_CONFIG_HOME || join(homedir(), ".config"), "forgeron", "credentials");

/** The token `forgeron login` stored, or `undefined` if nobody logged in here. */
export async function readCredentials(env: NodeJS.ProcessEnv = process.env) {
  try {
    return (await readFile(credentialsFile(env), "utf8")).trim() || undefined;
  } catch {
    return undefined;
  }
}
