// The few Node and Bun APIs the bench scripts use: the package has no @types/node or bun-types,
// and the bench is not shipped, so it declares them itself.

declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  exit(code?: number): never;
  memoryUsage(): { heapUsed: number; rss: number };
  versions: Record<string, string>;
  platform: string;
  arch: string;
};

declare const Bun: {
  version: string;
  gc(force: boolean): void;
  build(options: { entrypoints: string[]; target: "browser"; minify?: boolean }): Promise<{
    success: boolean;
    outputs: { text(): Promise<string> }[];
    logs: unknown[];
  }>;
  serve(options: {
    port: number;
    hostname?: string;
    fetch(req: Request): Response | Promise<Response>;
  }): { port: number; stop(force?: boolean): void };
};

interface ImportMeta {
  url: string;
}

declare module "node:fs" {
  export function readFileSync(path: string): Uint8Array<ArrayBuffer>;
  export function readFileSync(path: string, encoding: "utf8"): string;
  export function writeFileSync(path: string, data: string | Uint8Array): void;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  export function existsSync(path: string): boolean;
  export function copyFileSync(from: string, to: string): void;
}

declare module "node:zlib" {
  export function gzipSync(data: Uint8Array, options?: { level?: number }): Uint8Array;
  export function brotliCompressSync(data: Uint8Array): Uint8Array;
}

declare module "node:child_process" {
  export function execFileSync(
    cmd: string,
    args: string[],
    options?: { cwd?: string; stdio?: unknown; env?: Record<string, string | undefined> },
  ): { toString(): string };
  export function spawn(
    cmd: string,
    args: string[],
    options?: { stdio?: unknown },
  ): { kill(): void };
}

declare module "node:os" {
  export function cpus(): { model: string }[];
  export function totalmem(): number;
  export function release(): string;
  export function loadavg(): number[];
}
