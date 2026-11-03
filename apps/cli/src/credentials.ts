import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

// A person's credentials are never in the project (sdk.md §4): `forgeron login` stores them in the
// system keychain, or failing that in `~/.config/forgeron/credentials` (permissions 600).
// `XDG_CONFIG_HOME` moves the folder, as it does for other tools.

/** The system keychain, as the CLI needs it. The OS adapters are in keychain.ts; tests give a fake. */
export interface Keychain {
  get(account: string): Promise<string | undefined>;
  set(account: string, secret: string): Promise<void>;
  delete(account: string): Promise<void>;
}

/** The keychain entry's account: one signed-in person per machine, as with the file. */
const ACCOUNT = "forgeron";

const credentialsFile = (env: NodeJS.ProcessEnv = process.env) =>
  join(env.XDG_CONFIG_HOME || join(homedir(), ".config"), "forgeron", "credentials");

/** The token `forgeron login` stored, or `undefined` if nobody logged in here. */
export async function readCredentials(env: NodeJS.ProcessEnv = process.env, keychain?: Keychain) {
  try {
    const stored = await keychain?.get(ACCOUNT);
    if (stored) return stored;
  } catch {
    // A keychain that cannot be read (locked, absent) is not a reason to be signed out of the file.
  }
  let token: string | undefined;
  try {
    token = (await readFile(credentialsFile(env), "utf8")).trim() || undefined;
  } catch {
    return undefined;
  }
  // A token an earlier version (or a machine without keychain then) left in the file moves to the
  // keychain, and the file goes only once the keychain holds it.
  if (token && keychain) {
    try {
      await keychain.set(ACCOUNT, token);
      await rm(credentialsFile(env), { force: true });
    } catch {
      // Stays in the file.
    }
  }
  return token;
}

/** Stores the token in the keychain, or in the file (600) when there is none or it refuses. */
export async function writeCredentials(
  token: string,
  env: NodeJS.ProcessEnv = process.env,
  keychain?: Keychain,
): Promise<"keychain" | "file"> {
  if (keychain) {
    try {
      await keychain.set(ACCOUNT, token);
      // Never leave an older token in the file behind a newer one in the keychain.
      await rm(credentialsFile(env), { force: true });
      return "keychain";
    } catch {
      // Falls back to the file.
    }
  }
  const file = credentialsFile(env);
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  await writeFile(file, `${token}\n`, { mode: 0o600 });
  // `mode` only applies when the file is created: an older, wider file is narrowed too.
  await chmod(file, 0o600);
  return "file";
}

/** Forgets the token everywhere it was stored. */
export async function clearCredentials(
  env: NodeJS.ProcessEnv = process.env,
  keychain?: Keychain,
): Promise<void> {
  try {
    await keychain?.delete(ACCOUNT);
  } catch {
    // Nothing to forget there.
  }
  await rm(credentialsFile(env), { force: true });
}
