/**
 * The page of `scripts/blueprint/check-presenters.ts`, run in headless Chrome: each scene drawn by the engine once, put
 * on a canvas by the 2D presenter and by the WebGL2 presenter; `readPixels` of the WebGL2 canvas
 * (flipped to rows from the top) must equal the 2D canvas's `getImageData` and the engine's RGBA,
 * byte for byte. Also: a fifth WebGL2 presenter is refused (four per page).
 */
import { plan } from "../../src/core/filters";
import { resolvePalette } from "../../src/core/palette";
import type { Block } from "../../src/core/types";
import { present2d } from "../../src/dom/present-2d";
import { presentWebGL2 } from "../../src/dom/present-webgl2";
import { initBlueprint } from "../../src/engine/index";
import { createScene, createScriptScene } from "../../src/engine/scene";
import { readBlueprint } from "../../src/format/read";
import type { BlueprintFile } from "../../src/format/types";

interface Case {
  name: string;
  width: number;
  height: number;
  fill?: number;
  blocks?: Block[];
  file?: BlueprintFile;
}

const post = (path: string, body: unknown) =>
  fetch(path, { method: "POST", body: JSON.stringify(body) });

async function run(): Promise<unknown> {
  await initBlueprint(new URL("/fg_blueprint_bg.wasm", location.href));
  const cases = (await (await fetch("/cases.json")).json()) as Case[];
  const colors = resolvePalette(plan().colors);
  const out: { name: string; pixels: number; vs2d: number; vsEngine: number }[] = [];
  for (const c of cases) {
    const scene = c.file
      ? createScene(await readBlueprint(c.file, { location: `${c.name}.bp.json` }), c.name, {
          ...(c.fill !== undefined ? { fill: c.fill } : {}),
        })
      : createScriptScene({ blocks: c.blocks! }, c.fill !== undefined ? { fill: c.fill } : {});
    scene.resize(c.width, c.height);
    scene.palette(colors);
    scene.frame(1.7, 0);
    const a = document.createElement("canvas");
    const b = document.createElement("canvas");
    document.body.append(a, b);
    const p2 = present2d(a);
    p2.resize(c.width, c.height, 1, 0);
    p2.present(scene);
    const gl = presentWebGL2(b);
    if (!gl) throw new Error("no WebGL2 presenter");
    gl.palette(colors);
    gl.resize(c.width, c.height, 1, 0);
    gl.present(scene);
    const { width: w, height: h } = scene.size;
    const read = new Uint8Array(w * h * 4);
    gl.gl.readPixels(0, 0, w, h, gl.gl.RGBA, gl.gl.UNSIGNED_BYTE, read);
    const flipped = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++)
      flipped.set(read.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
    const twoD = a.getContext("2d")!.getImageData(0, 0, w, h).data;
    const rgba = scene.rgba!;
    let vs2d = 0;
    let vsEngine = 0;
    for (let i = 0; i < flipped.length; i++) {
      if (flipped[i] !== twoD[i]) vs2d++;
      if (flipped[i] !== rgba[i]) vsEngine++;
    }
    out.push({ name: c.name, pixels: w * h, vs2d, vsEngine });
    gl.dispose();
    p2.dispose();
    scene.dispose();
    a.remove();
    b.remove();
  }
  const held = [0, 1, 2, 3, 4].map(() => presentWebGL2(document.createElement("canvas")));
  const refused = held[4] === null && held.slice(0, 4).every((p) => p !== null);
  for (const p of held) p?.dispose();
  return { cases: out, fifthRefused: refused };
}

run().then(
  (r) => post("/result", r),
  (e: unknown) => post("/result", { error: String((e as Error)?.stack ?? e) }),
);
