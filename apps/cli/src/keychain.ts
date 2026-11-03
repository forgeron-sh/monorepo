import { spawn } from "node:child_process";
import type { Keychain } from "./credentials";

// The system keychain adapters (D-035). The token never travels as an argument (it would show in
// `ps`): it goes to the program's standard input. Windows has no adapter: the 600 file is used.

/** Runs a program with `input` on its standard input; rejects when the program cannot start. */
export type Runner = (
  command: string,
  args: string[],
  input?: string,
) => Promise<{ code: number; stdout: string }>;

const SERVICE = "forgeron";

/** The real runner: no shell, standard error discarded (it may repeat what was sent). */
const spawnRunner: Runner = (command, args, input) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "ignore"] });
    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.once("error", reject);
    child.once("close", (code) => resolve({ code: code ?? 1, stdout }));
    child.stdin.on("error", () => undefined);
    child.stdin.end(input ?? "");
  });

const ok = (result: { code: number }, what: string) => {
  if (result.code !== 0) throw new Error(`${what} failed (exit ${result.code}).`);
};

/** A token is one line of printable characters: anything else is refused, not quoted. */
const checked = (secret: string) => {
  if (!/^[\x21-\x7e]+$/.test(secret))
    throw new Error("The token has characters a keychain refuses.");
  return secret;
};

/** macOS Keychain through `security -i`, which reads its commands from standard input. */
export function macKeychain(run: Runner): Keychain {
  const quote = (value: string) => `"${value.replace(/["\\]/g, "\\$&")}"`;
  return {
    async get(account) {
      const result = await run("security", [
        "find-generic-password",
        "-s",
        SERVICE,
        "-a",
        account,
        "-w",
      ]);
      return result.code === 0 ? result.stdout.replace(/\r?\n$/, "") || undefined : undefined;
    },
    async set(account, secret) {
      const line = `add-generic-password -U -s ${SERVICE} -a ${quote(account)} -w ${quote(checked(secret))}\n`;
      ok(await run("security", ["-i"], line), "security add-generic-password");
    },
    async delete(account) {
      // Exit 44 is "not found": there was nothing to forget.
      await run("security", ["delete-generic-password", "-s", SERVICE, "-a", account]);
    },
  };
}

/** libsecret through `secret-tool`, which reads the secret from standard input. */
export function secretToolKeychain(run: Runner): Keychain {
  const attributes = (account: string) => ["service", SERVICE, "account", account];
  return {
    async get(account) {
      const result = await run("secret-tool", ["lookup", ...attributes(account)]);
      return result.code === 0 ? result.stdout.replace(/\r?\n$/, "") || undefined : undefined;
    },
    async set(account, secret) {
      ok(
        await run(
          "secret-tool",
          ["store", "--label=Forgeron CLI token", ...attributes(account)],
          checked(secret),
        ),
        "secret-tool store",
      );
    },
    async delete(account) {
      await run("secret-tool", ["clear", ...attributes(account)]);
    },
  };
}

/**
 * The keychain of this platform, or `undefined` (Windows, other systems): the file is used then.
 * On Linux `secret-tool` may be missing or have no session bus: its calls fail and the credentials
 * code falls back to the file.
 */
export function systemKeychain(
  platform: NodeJS.Platform = process.platform,
  run: Runner = spawnRunner,
): Keychain | undefined {
  if (platform === "darwin") return macKeychain(run);
  if (platform === "linux") return secretToolKeychain(run);
  return undefined;
}
