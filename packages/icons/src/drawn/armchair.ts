import type { PixelIcon } from "../types";

// Armchair seen from the front: a back, two arms, a seat and legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "armchair",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    "..#......#",
    "..#......#",
    ".###....###",
    ".#.######.#",
    ".#........#",
    ".##########",
    ".#........#",
  ],
};

export default icon;
