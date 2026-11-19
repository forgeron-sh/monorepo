// CPU and GLSL of every pass in headless Chrome (docs/shaders/design.md §6): bundles
// `agreement.page.ts`, serves it on a free port (never 5181), runs chrome-headless-shell (CHROME
// overrides it) and fails when an exact case differs by one pixel or a float case by more than
// its tolerance.
//   bun scripts/shaders/check-agreement.ts   (or moon run shaders:agreement)
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const root = new URL("../../", import.meta.url).pathname;
const chrome =
  process.env.CHROME ??
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
if (!existsSync(chrome)) throw new Error(`no Chrome at ${chrome}: set CHROME`);

/**
 * Share of pixels a float case may differ by. Image luminance: 0.1 % (measured 0). The fields:
 * 10 % (measured 3.4 to 8.5 % in SwiftShader): their hash noise multiplies `sin` of arguments in
 * the thousands by 43758, so float32 against float64 moves a cell's value across its threshold;
 * rounding the CPU's arguments to float32 made it worse (the GPU's `sin` differs too).
 */
const TOLERANCE: [RegExp, number][] = [
  [/^image-dither/, 0.001],
  [/^field /, 0.1],
  [/^halftone/, 0.005],
  [/scanlines/, 0.02],
  [/^edges/, 0.01],
  [/^crt/, 0.02],
];

const build = await Bun.build({
  entrypoints: [`${root}packages/shaders/test/browser/agreement.page.ts`],
  target: "browser",
});
if (!build.success) throw new Error(`bundle failed: ${JSON.stringify(build.logs)}`);
const js = await build.outputs[0]!.text();
const html = `<!doctype html><meta charset="utf-8"><title>agreement</title><body><script type="module" src="/main.js"></script>`;

interface Result {
  error?: string;
  cases?: { name: string; pixels: number; differ: number; exact: boolean; error?: string }[];
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
    `--user-data-dir=${root}target/bench/chrome-shaders`,
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
let failed = false;
for (const c of result.cases ?? []) {
  const share = c.pixels ? c.differ / c.pixels : 1;
  const tolerance = c.exact ? 0 : (TOLERANCE.find(([re]) => re.test(c.name))?.[1] ?? 0);
  const ok = !c.error && c.differ >= 0 && share <= tolerance;
  failed ||= !ok;
  console.log(
    `${ok ? "agree " : "DIFFER"} ${c.name.padEnd(56)} ${c.differ}/${c.pixels} px (${(share * 100).toFixed(3)} %, ${c.exact ? "exact" : `tolerance ${(tolerance * 100).toFixed(1)} %`})${c.error ? ` ${c.error}` : ""}`,
  );
}
console.log(failed ? "agreement: FAILED" : `agreement: ${result.cases?.length} cases agree`);
process.exit(failed ? 1 : 0);
