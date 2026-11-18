import type { PixelIcon } from "../types";

// Estimate: a sheet with a folded corner, an approximately-equal sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "estimate-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    "..#...##",
    "..#...#.#",
    "..#...####",
    "..#......#",
    "..#.oo..o#",
    "..#o..oo.#",
    "..#.oo..o#",
    "..#o..oo.#",
    "..########",
  ],
};

export default icon;
