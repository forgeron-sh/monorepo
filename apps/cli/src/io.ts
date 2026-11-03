import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import type { Keychain } from "./credentials";

/** What a command needs of the outside world: tests give their own. */
export interface Io {
  cwd: string;
  log(message: string): void;
  error(message: string): void;
  /** Runs a program with the terminal attached and resolves with its exit code. */
  exec(command: string, args: string[], cwd: string): Promise<number>;
  /** Runs a program and resolves with its exit code and standard output (standard error stays on the terminal); rejects when it cannot start; absent when a program's output cannot be read. */
  capture?(command: string, args: string[], cwd: string): Promise<{ code: number; stdout: string }>;
  /** Asks a yes/no question on the terminal; absent when nobody can answer (then `--yes` is needed). */
  confirm?(question: string): Promise<boolean>;
  /** Reads a value from the keyboard without echoing it (or from piped input); never an argument. */
  readSecret?(prompt: string): Promise<string>;
  /** The system keychain, when the platform has an adapter: without it credentials go to the file. */
  keychain?: Keychain;
  /** Opens a URL in the person's browser; absent when there is none (the URL is printed anyway). */
  openUrl?(url: string): Promise<void>;
  /** Resolves when the person asks a long-running command to stop (Ctrl-C). */
  stopped: Promise<void>;
}

/** The command was used wrongly: exit code 2 (sdk.md §5). */
export class UsageError extends Error {
  override name = "UsageError";
}

/** What was asked for does not exist: exit code 4 (sdk.md §5). */
export class NotFoundError extends Error {
  override name = "NotFoundError";
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
    capture: (command, args, cwd) =>
      new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "inherit"] });
        let stdout = "";
        child.stdout.setEncoding("utf8");
        child.stdout.on("data", (chunk) => (stdout += chunk));
        child.once("error", reject);
        child.once("close", (code) => resolve({ code: code ?? 1, stdout }));
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
    openUrl: openInBrowser,
    stopped: new Promise((resolve) => process.once("SIGINT", () => resolve())),
  };
}

/** The browser of the platform, started without a shell so the URL is never interpreted. */
function openInBrowser(url: string): Promise<void> {
  const [command, ...args] =
    process.platform === "darwin"
      ? ["open", url]
      : process.platform === "win32"
        ? ["rundll32", "url.dll,FileProtocolHandler", url]
        : ["xdg-open", url];
  return new Promise((resolve, reject) => {
    const child = spawn(command!, args, { stdio: "ignore", detached: true });
    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
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
