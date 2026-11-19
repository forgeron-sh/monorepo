// The presenters in headless Chrome (docs/blueprint/engine.md, P3): for ten scenes, the WebGL2
// presenter's `readPixels` equals the 2D presenter's RGBA, byte for byte, and a fifth WebGL2
// presenter is refused. Bundles `presenters.page.ts`, serves it with the module on a free port
// (never 5181), runs chrome-headless-shell (CHROME overrides it) and fails on any difference.
//   bun scripts/blueprint/check-presenters.ts   (or moon run blueprint:presenters)
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { evaluate } from "../../apps/site/src/illustrations/library/samples";

const root = new URL("../../", import.meta.url).pathname;
const chrome =
  process.env.CHROME ??
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
if (!existsSync(chrome)) throw new Error(`no Chrome at ${chrome}: set CHROME`);

/** Eight scenes on the script layer (their blocks at t = 1.7) and two from data. */
const SCRIPT = [
  "erp-village",
  "machine",
  "resources",
  "production-line",
  "dashboard",
  "permissions-iso",
  "forge-cta",
  "stack6",
];
const DATA = ["web", "usage-iso"];
const cases = [
  ...SCRIPT.map((name) => ({
    name,
    width: name === "erp-village" || name === "machine" ? 720 : 212,
    height: name === "erp-village" || name === "machine" ? 450 : 139,
    fill: name === "erp-village" ? 0.98 : name === "machine" ? 0.94 : 0.8,
    blocks: evaluate(name, { t: 1.7, active: 1, progress: 0.5 }),
  })),
  ...DATA.map((name) => ({
    name,
    width: 212,
    height: 139,
    file: JSON.parse(readFileSync(`${root}packages/libraries/blueprints/${name}.bp`, "utf8")),
  })),
];

const build = await Bun.build({
  entrypoints: [`${root}packages/blueprint/test/browser/presenters.page.ts`],
  target: "browser",
});
if (!build.success) throw new Error(`bundle failed: ${JSON.stringify(build.logs)}`);
const js = await build.outputs[0]!.text();
const html = `<!doctype html><meta charset="utf-8"><title>presenters</title><body><script type="module" src="/main.js"></script>`;

interface Result {
  error?: string;
  cases?: { name: string; pixels: number; vs2d: number; vsEngine: number }[];
  fifthRefused?: boolean;
}
let done: (r: Result) => void = () => {};
const finished = new Promise<Result>((r) => (done = r));
const server = Bun.serve({
  port: 0,
  hostname: "127.0.0.1",
  async fetch(req) {
    const path = new URL(req.url).pathname;
    if (req.method === "POST" && path === "/result") {
      done(JSON.parse(await req.text()) as Result);
      return new Response("ok");
    }
    if (path === "/") return new Response(html, { headers: { "content-type": "text/html" } });
    if (path === "/main.js")
      return new Response(js, { headers: { "content-type": "text/javascript" } });
    if (path === "/cases.json") return Response.json(cases);
    if (path === "/fg_blueprint_bg.wasm")
      return new Response(readFileSync(`${root}packages/blueprint/wasm/fg_blueprint_bg.wasm`), {
        headers: { "content-type": "application/wasm" },
      });
    return new Response("not found", { status: 404 });
  },
});
if (server.port === 5181) throw new Error("port 5181 is reserved");

const proc = spawn(
  chrome,
  [
    "--headless",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--no-first-run",
    `--user-data-dir=${root}target/bench/chrome-presenters`,
    `http://127.0.0.1:${server.port}/`,
  ],
  { stdio: "ignore" },
);
const timer = setTimeout(() => done({ error: "timed out after 120 s" }), 120_000);
const result = await finished;
clearTimeout(timer);
proc.kill();
server.stop(true);
if (result.error) {
  console.error(`the page failed: ${result.error}`);
  process.exit(1);
}
let failed = !result.fifthRefused;
for (const c of result.cases ?? []) {
  const ok = c.vs2d === 0 && c.vsEngine === 0;
  failed ||= !ok;
  console.log(
    `${ok ? "equal " : "DIFFER"} ${c.name.padEnd(16)} ${c.pixels} px: ${c.vs2d} bytes vs 2D, ${c.vsEngine} vs engine RGBA`,
  );
}
console.log(`fifth WebGL2 presenter refused: ${result.fifthRefused}`);
console.log(failed ? "presenters: FAILED" : `presenters: ${result.cases?.length} scenes equal`);
process.exit(failed ? 1 : 0);
