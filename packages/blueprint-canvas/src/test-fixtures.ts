// The test scene and a 2D canvas that records its draws, shared by the stage and viewer suites.
import type { BlueprintFile } from "@forgeron/blueprint/format";
import { vi } from "vitest";

/**
 * Two tagged towers of different heights on a plate: every view draws a different picture. They
 * sit one layer up: in painter's order the plate's key is larger than a short tower's, and the
 * plate would be drawn over it (what the z-buffer review is about).
 */
export const FILE: BlueprintFile = {
  $schema: "https://blueprint.forgeron.sh/schema/v1.json",
  version: 1,
  id: "test/towers",
  parts: {
    plate: { prims: [{ kind: "box", at: [0, 0, 0], size: [12, 8, 1], tag: "plate" }] },
    tower: {
      params: { h: { type: "number", default: 4 } },
      prims: [{ kind: "box", at: [0, 0, 0], size: [3, 3, "@h"], look: "accent" }],
    },
  },
  assemblies: {
    pair: {
      instances: [
        { use: "plate" },
        { id: "a", use: "tower", at: [1, 1, 1], tag: "tall", params: { h: 9 }, layer: 1 },
        { id: "b", use: "tower", at: [8, 4, 1], tag: "short", params: { h: 3 }, layer: 1 },
      ],
    },
  },
  scenes: {
    towers: {
      title: "Two towers",
      depth: "painter",
      camera: { view: 0, fit: { fill: 0.8 } },
      root: { instances: [{ id: "pair", use: "pair" }] },
      vars: { progress: { type: "progress" }, pointer: { type: "pointer" } },
      timelines: {
        grow: {
          tracks: [{ kind: "spin", target: "pair/b", channel: "param:h", rate: 1, phase: 3 }],
        },
      },
      machines: {
        story: {
          initial: "start",
          states: { start: {}, end: {} },
          transitions: [
            { from: "*", to: "start", when: { var: "progress", range: [0, 0.5] } },
            { from: "*", to: "end", when: { var: "progress", range: [0.5, 1.01] } },
          ],
        },
      },
    },
  },
};

/** A 2D context that records its draws (jsdom draws nothing). */
export function fakeCanvas() {
  const draws: { x: number; y: number; w: number; h: number }[] = [];
  const ctx = {
    imageSmoothingEnabled: true,
    clearRect: () => {},
    drawImage: (_: unknown, x: number, y: number, w: number, h: number) =>
      draws.push({ x, y, w, h }),
    createImageData: (w: number, h: number) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
    }),
    putImageData: () => {},
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
    this: HTMLCanvasElement,
    kind: string,
  ) {
    return (kind === "2d" ? ctx : null) as never;
  });
  return draws;
}
