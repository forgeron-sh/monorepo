import type { PixelIcon } from "../types";

// Scheme: four boxes linked by lines, the node in focus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scheme",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#.######.#",
    ".###....###",
    "..#......#",
    "..#..oo..#",
    "..#..oo..#",
    "..#......#",
    ".###....###",
    ".#.#....#.#",
    ".###....###",
  ],
};

export default icon;
