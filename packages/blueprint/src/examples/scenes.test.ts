import { describe, expect, it } from "vitest";
import {
  dither,
  frameView,
  Material,
  pixelate,
  render,
  renderSvg,
  type Rendered,
  sceneAt,
  Slot,
} from "../index";
import { project } from "../core/project";
import { cube, stack } from "./scenes";

/** Per-material and per-slot pixel counts: a compact fingerprint of a frame. */
function summary({ frame, view }: Rendered) {
  const materials: Record<string, number> = {};
  const slots: Record<string, number> = {};
  const mName = Object.fromEntries(Object.entries(Material).map(([k, v]) => [v, k]));
  const sName = Object.fromEntries(Object.entries(Slot).map(([k, v]) => [v, k]));
  frame.material.forEach((m, i) => {
    const mk = mName[m] ?? String(m);
    materials[mk] = (materials[mk] ?? 0) + 1;
    const sk = sName[frame.color[i] ?? 0] ?? "?";
    slots[sk] = (slots[sk] ?? 0) + 1;
  });
  return { size: [frame.width, frame.height], view, materials, slots };
}

// The lab renders these at `data-scale="3"` with a 4×4 dither on faces.
const filters = [pixelate(3), dither({ matrix: 4 })];
const target = { width: 480, height: 360, filters };

describe("reference scene: cube", () => {
  it("frames on an even unit, the floor grid left out of the framing", () => {
    const r = render(cube, target);
    expect(r.view.u % 2).toBe(0);
    expect(summary(r)).toMatchInlineSnapshot(`
      {
        "materials": {
          "Edge": 1041,
          "Empty": 13271,
          "FaceLeft": 1642,
          "FaceRight": 1640,
          "FaceTop": 1606,
        },
        "size": [
          160,
          120,
        ],
        "slots": {
          "Accent": 188,
          "Bg": 4059,
          "Dim": 747,
          "Faint": 589,
          "Ink": 346,
          "None": 13271,
        },
        "view": {
          "ox": 80,
          "oy": 69,
          "u": 4,
        },
      }
    `);
  });

  it("keeps its framing while the small cube bobs", () => {
    const view = frameView(cube, 160, 120);
    for (const t of [0, 0.7, 1.9]) expect(render(cube, { ...target, t }).view).toEqual(view);
  });

  it("draws the big cube's front top edge as regular 2:1 runs", () => {
    const r = render(cube, target);
    const { frame, view } = r;
    // The front edge of the top face, which nothing hides (the back edges sit under the small cube).
    const a = project([10, 0, 10], view);
    const b = project([10, 10, 10], view);
    let rowsWithTwo = 0;
    // Along the edge only (the floor grid shows behind the cube), ink pixels of the outline.
    for (let y = a[1] + 1; y < b[1]; y++) {
      const ex = a[0] - (y - a[1]) * 2;
      let n = 0;
      for (let x = ex - 2; x <= ex + 1; x++) {
        const i = y * frame.width + x;
        if (frame.material[i] === Material.Edge && frame.ink[i] === Slot.Ink) n++;
      }
      if (n === 2) rowsWithTwo++;
    }
    expect(rowsWithTwo).toBe(b[1] - a[1] - 1);
  });

  it("has accent pixels (the small cube) and keeps them on edges and faces", () => {
    const r = render(cube, target);
    expect(r.frame.color.some((c) => c === Slot.Accent)).toBe(true);
  });
});

describe("reference scene: stack", () => {
  it("highlights the active plate only", () => {
    const none = render(stack, target);
    const second = render(stack, { ...target, active: 2 });
    expect(none.frame.color.some((c) => c === Slot.Accent)).toBe(false);
    expect(second.frame.color.some((c) => c === Slot.Accent)).toBe(true);
    expect(summary(second)).toMatchInlineSnapshot(`
      {
        "materials": {
          "Detail": 314,
          "Dot": 32,
          "Edge": 633,
          "Empty": 16567,
          "FaceLeft": 251,
          "FaceRight": 175,
          "FaceTop": 1228,
        },
        "size": [
          160,
          120,
        ],
        "slots": {
          "Accent": 192,
          "Bg": 1453,
          "Dim": 244,
          "Faint": 184,
          "Ink": 560,
          "None": 16567,
        },
        "view": {
          "ox": 80,
          "oy": 70,
          "u": 2,
        },
      }
    `);
  });

  it("is data at every instant: a frame survives JSON and renders the same SVG", () => {
    const scene = sceneAt(stack, 1.3, 1);
    const copy = JSON.parse(JSON.stringify(scene));
    expect(renderSvg(copy, target)).toBe(renderSvg(scene, target));
    expect(renderSvg(stack, { ...target, t: 1.3, active: 1 })).toBe(renderSvg(scene, target));
  });
});
