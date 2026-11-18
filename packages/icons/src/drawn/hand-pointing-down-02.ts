import type { PixelIcon } from "../types";

// Hand pointing down, thumb on the right: `hand-pointing-down-01` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hand-pointing-down-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    "",
    "..#####",
    ".#######",
    ".########",
    ".#######.#",
    ".#.#.#.#..#",
    ".......#",
    ".......#",
  ],
};

export default icon;
