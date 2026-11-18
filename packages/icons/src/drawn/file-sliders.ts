import type { PixelIcon } from "../types";

// File with sliders: the `file-01` sheet with two slider lines and their knobs in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-sliders",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    "..#...##",
    "..#...#.#",
    "..#...####",
    "..#..o...#",
    "..#.oooo.#",
    "..#..o.o.#",
    "..#.oooo.#",
    "..#....o.#",
    "..########",
  ],
};

export default icon;
