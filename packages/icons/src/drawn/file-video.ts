import type { PixelIcon } from "../types";

// File with a play triangle inside in the secondary tone: `file-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-video",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    "..#...##",
    "..#...#.#",
    "..#...####",
    "..#.oo...#",
    "..#.oooo.#",
    "..#.oooo.#",
    "..#.oo...#",
    "..#......#",
    "..########",
  ],
};

export default icon;
