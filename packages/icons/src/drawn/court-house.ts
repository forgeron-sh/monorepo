import type { PixelIcon } from "../types";

// Court house: a pediment on four columns over a stepped base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "court-house",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "...##..##",
    ".##......##",
    ".##########",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#.#..#.#",
    ".##########",
    "############",
  ],
};

export default icon;
