import type { PixelIcon } from "../types";

// The Nintendo Switch mark in pixels: the outlined left controller with its stick, the solid right
// one with its button cut out.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "nintendo-switch",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".#####.####",
    "##...#.#####",
    "#....#.#####",
    "#.##.#.#####",
    "#.##.#.#####",
    "#....#.#####",
    "#....#.#####",
    "#....#.#..##",
    "#....#.#..##",
    "#....#.#####",
    "##...#.#####",
    ".#####.####",
  ],
};

export default icon;
