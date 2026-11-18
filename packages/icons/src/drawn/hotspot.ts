import type { PixelIcon } from "../types";

// Hotspot: a dot in the secondary tone broadcasting two arcs each side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hotspot",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#........#",
    "#..#....#..#",
    "#.#..oo..#.#",
    "#.#..oo..#.#",
    "#..#....#..#",
    ".#........#",
  ],
};

export default icon;
