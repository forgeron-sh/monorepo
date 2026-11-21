import type { PixelIcon } from "../types";

// Structure: a root node on the left branching to two nodes on the right, one-pixel connectors.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "structure-04",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........####",
    "......###..#",
    "......#.####",
    "......#",
    ".####.#",
    ".#..###",
    ".####.#",
    "......#",
    "......#.####",
    "......###..#",
    "........####",
  ],
};

export default icon;
