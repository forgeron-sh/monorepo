// Builds fg-canvas-core for the browser and reports its size.
//   bun packages/canvas/bench/build-wasm.ts
// Needs the toolchain of `rust-toolchain.toml` (installed by rustup with its wasm target) and
// `wasm-bindgen` at the exact version of the crate's dependency; `wasm-opt` is used when found.
// Output: target/fg-canvas-core-web/<variant>/ (fg_canvas_core.js + fg_canvas_core_bg.wasm).

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { brotliCompressSync, gzipSync } from "node:zlib";

const root = new URL("../../../", import.meta.url).pathname;
const out = `${root}target/fg-canvas-core-web`;
const home = process.env.HOME ?? "";
const channel = /channel\s*=\s*"([^"]+)"/.exec(
  readFileSync(`${root}rust-toolchain.toml`, "utf8"),
)?.[1];
if (!channel) throw new Error("no channel in rust-toolchain.toml");
const pinned = /wasm-bindgen = "=([^"]+)"/.exec(
  readFileSync(`${root}crates/fg-canvas-core/Cargo.toml`, "utf8"),
)?.[1];

const tool = (name: string) => {
  const local = `${home}/.cargo/bin/${name}`;
  return existsSync(local) ? local : name;
};
const run = (cmd: string, args: string[], env?: Record<string, string | undefined>) =>
  execFileSync(cmd, args, {
    cwd: root,
    stdio: ["ignore", "pipe", "inherit"],
    ...(env ? { env: { ...process.env, ...env } } : {}),
  }).toString();
// The pinned toolchain's own cargo and rustc, whatever is first on PATH (Homebrew's rust has no
// wasm target).
const which = (bin: string) => run("rustup", ["which", "--toolchain", channel, bin]).trim();
const cargo = which("cargo");
const rustc = which("rustc");

const bindgen = tool("wasm-bindgen");
const version = run(bindgen, ["--version"]).trim().split(" ")[1];
if (version !== pinned) {
  throw new Error(
    `wasm-bindgen ${version} found, the crate pins ${pinned}: cargo install --locked wasm-bindgen-cli --version =${pinned}`,
  );
}

interface Size {
  variant: string;
  wasm: number;
  wasmGzip: number;
  wasmBrotli: number;
  glue: number;
  glueGzip: number;
}
const sizes: Size[] = [];
const measure = (variant: string, dir: string) => {
  const wasm = readFileSync(`${dir}/fg_canvas_core_bg.wasm`);
  const glue = readFileSync(`${dir}/fg_canvas_core.js`);
  sizes.push({
    variant,
    wasm: wasm.length,
    wasmGzip: gzipSync(wasm, { level: 9 }).length,
    wasmBrotli: brotliCompressSync(wasm).length,
    glue: glue.length,
    glueGzip: gzipSync(glue, { level: 9 }).length,
  });
};

let wasmOpt: string | null = tool("wasm-opt");
try {
  run(wasmOpt, ["--version"]);
} catch {
  wasmOpt = null;
}

for (const profile of ["release", "release-speed"]) {
  run(
    cargo,
    ["build", "-p", "fg-canvas-core", "--target", "wasm32-unknown-unknown", "--profile", profile],
    { RUSTC: rustc },
  );
  const dir = `${out}/${profile}`;
  mkdirSync(dir, { recursive: true });
  run(bindgen, [
    `target/wasm32-unknown-unknown/${profile}/fg_canvas_core.wasm`,
    "--target",
    "web",
    "--out-dir",
    dir,
  ]);
  measure(profile, dir);
  if (wasmOpt) {
    const opt = `${dir}-opt`;
    mkdirSync(opt, { recursive: true });
    copyFileSync(`${dir}/fg_canvas_core.js`, `${opt}/fg_canvas_core.js`);
    run(wasmOpt, [
      profile === "release" ? "-Oz" : "-O3",
      "--all-features",
      `${dir}/fg_canvas_core_bg.wasm`,
      "-o",
      `${opt}/fg_canvas_core_bg.wasm`,
    ]);
    measure(`${profile} + wasm-opt ${profile === "release" ? "-Oz" : "-O3"}`, opt);
  }
}

writeFileSync(`${out}/sizes.json`, JSON.stringify(sizes, null, 2));
const kb = (b: number) => `${(b / 1024).toFixed(1)} KB`;
console.log("| variant | .wasm | gzip | brotli | JS glue | glue gzip |");
console.log("| --- | --: | --: | --: | --: | --: |");
for (const s of sizes) {
  console.log(
    `| ${s.variant} | ${kb(s.wasm)} | ${kb(s.wasmGzip)} | ${kb(s.wasmBrotli)} | ${kb(s.glue)} | ${kb(s.glueGzip)} |`,
  );
}
