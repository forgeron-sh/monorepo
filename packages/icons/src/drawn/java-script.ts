import type { PixelIcon } from "../types";

// The JavaScript logo mark in pixels: a filled square with the letters JS cut out in its lower
// right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "java-script",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "############",
    "############",
    "############",
    "############",
    "############",
    "#####.##..##",
    "#####.#.####",
    "#####.##.###",
    "###.#.###.##",
    "####.##..###",
    "############",
    "############",
  ],
};

export default icon;
