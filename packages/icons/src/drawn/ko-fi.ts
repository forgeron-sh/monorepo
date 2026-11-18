import type { PixelIcon } from "../types";

// The Ko-fi mark in pixels: a coffee cup with its handle, the heart inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "ko-fi",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "#########",
    "#.......####",
    "#.oo.oo.#..#",
    "#.ooooo.#..#",
    "#.ooooo.#..#",
    "#..ooo..####",
    "#...o...#",
    "#.......#",
    ".#######",
  ],
};

export default icon;
