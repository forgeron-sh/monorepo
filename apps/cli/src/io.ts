import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";

/** What a command needs of the outside world: tests give their own. */
export interface Io {
  cwd: string;
  log(message: string): void;
  error(message: string): void;
  /** Runs a program with the terminal attached and resolves with its exit code. */
  exec(command: string, args: string[], cwd: string): Promise<number>;
  /** Asks a yes/no question on the terminal; absent when nobody can answer (then `--yes` is needed). */
  confirm?(question: string): Promise<boolean>;
  /** Resolves when the person asks a long-running command to stop (Ctrl-C). */
  stopped: Promise<void>;
}

/** The command was used wrongly: exit code 2 (sdk.md §5). */
export class UsageError extends Error {
  override name = "UsageError";
}

export function terminal(): Io {
  return {
    cwd: process.cwd(),
    log: (message) => console.log(message),
    error: (message) => console.error(message),
    exec: (command, args, cwd) =>
      new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd, stdio: "inherit" });
        child.once("error", reject);
        child.once("exit", (code) => resolve(code ?? 1));
      }),
    confirm: async (question) => {
      if (!process.stdin.isTTY) return false;
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      try {
        return /^y(es)?$/i.test((await rl.question(`${question} [y/N] `)).trim());
      } finally {
        rl.close();
      }
    },
    stopped: new Promise((resolve) => process.once("SIGINT", () => resolve())),
  };
}
