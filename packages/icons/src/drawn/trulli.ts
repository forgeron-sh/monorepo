import type { PixelIcon } from "../types";

// Trullo: a conical stone roof with a finial on a whitewashed wall with a door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "trulli",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....####",
    "....#..#",
    "...#....#",
    "...#....#",
    "..#......#",
    "..#......#",
    ".##########",
    "..#..##..#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..########",
  ],
};

export default icon;
