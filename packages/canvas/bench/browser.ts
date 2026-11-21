// The browser benchmark: bundles bench/browser/main.ts, serves it with the built WebAssembly on a
// free port (cross-origin isolated, for a 5 µs timer), runs it in headless Chrome and prints the
// tables. Headless Chrome draws with SwiftShader (a CPU rasteriser): its draw times are indicative.
//   bun packages/canvas/bench/build-wasm.ts && bun packages/canvas/bench/browser.ts [--sizes ..]
// CHROME may point at another Chrome binary.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { loadavg } from "node:os";
import { report, type RunReport } from "./report";

const root = new URL("../../../", import.meta.url).pathname;
const here = new URL(".", import.meta.url).pathname;
const chrome =
  process.env.CHROME ??
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
if (!existsSync(chrome)) throw new Error(`no Chrome at ${chrome}: set CHROME`);
const i = process.argv.indexOf("--sizes");
const query = i >= 0 ? `?sizes=${process.argv[i + 1]}` : "";

const build = await Bun.build({ entrypoints: [`${here}browser/main.ts`], target: "browser" });
if (!build.success) throw new Error(`bundle failed: ${JSON.stringify(build.logs)}`);
const js = await build.outputs[0]!.text();
const html = `<!doctype html><meta charset="utf-8"><title>canvas bench</title><canvas></canvas><script type="module" src="/main.js"></script>`;
const isolated = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

let done: (r: RunReport | { error: string }) => void = () => {};
const finished = new Promise<RunReport | { error: string }>((r) => (done = r));
const server = Bun.serve({
  port: 0,
  hostname: "127.0.0.1",
  async fetch(req) {
    const path = new URL(req.url).pathname;
    if (req.method === "POST") {
      const body = await req.text();
      if (path === "/log") console.error(`[page] ${JSON.parse(body)}`);
      if (path === "/result") done(JSON.parse(body));
      return new Response("ok");
    }
    if (path === "/")
      return new Response(html, { headers: { ...isolated, "content-type": "text/html" } });
    if (path === "/main.js") {
      return new Response(js, { headers: { ...isolated, "content-type": "text/javascript" } });
    }
    const m = /^\/wasm\/([\w-]+)\/(fg_canvas_core(?:_bg\.wasm|\.js))$/.exec(path);
    if (m) {
      const type = m[2]!.endsWith(".wasm") ? "application/wasm" : "text/javascript";
      const file = readFileSync(`${root}target/fg-canvas-core-web/${m[1]}/${m[2]}`);
      return new Response(file, { headers: { ...isolated, "content-type": type } });
    }
    return new Response("not found", { status: 404 });
  },
});

const proc = spawn(
  chrome,
  [
    "--headless",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--enable-precise-memory-info",
    "--js-flags=--expose-gc",
    "--window-size=1280,800",
    "--no-first-run",
    `--user-data-dir=${root}target/bench/chrome-profile`,
    `http://127.0.0.1:${server.port}/${query}`,
  ],
  { stdio: "ignore" },
);
const result = await finished;
proc.kill();
server.stop(true);
if ("error" in result) {
  console.error(`the page failed: ${result.error}`);
  process.exit(1);
}
result.machine.loadAverage = loadavg()
  .map((l) => l.toFixed(1))
  .join(" ");
mkdirSync(`${root}target/bench`, { recursive: true });
writeFileSync(`${root}target/bench/browser.json`, JSON.stringify(result, null, 2));
console.log(report(result));
process.exit(0);
