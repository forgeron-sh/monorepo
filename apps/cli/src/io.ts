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
  /** Reads a value from the keyboard without echoing it (or from piped input); never an argument. */
  readSecret?(prompt: string): Promise<string>;
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
    readSecret: readHidden,
    stopped: new Promise((resolve) => process.once("SIGINT", () => resolve())),
  };
}

/** A line typed without echo on a terminal; the whole input when it is piped. */
function readHidden(prompt: string): Promise<string> {
  const { stdin, stderr } = process;
  if (!stdin.isTTY) {
    return new Promise((resolve, reject) => {
      let data = "";
      stdin.setEncoding("utf8");
      stdin.on("data", (chunk) => (data += chunk));
      stdin.once("end", () => resolve(data.replace(/\r?\n$/, "")));
      stdin.once("error", reject);
    });
  }
  stderr.write(prompt);
  return new Promise((resolve) => {
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n" || char === "\u0004") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stderr.write("\n");
          return resolve(value);
        }
        if (char === "\u0003") process.kill(process.pid, "SIGINT");
        else if (char === "\u007f") value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.on("data", onData);
  });
}
