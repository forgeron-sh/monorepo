import type { PixelIcon } from "../types";

// Camel in profile: two humps, a raised neck and head, four thin legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "camel",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........###",
    "...#..#..##",
    "..######.#",
    ".########",
    ".########",
    "..######",
    "..##..##",
    "..#....#",
    "..#....#",
    "..#....#",
  ],
};

export default icon;
