import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`key`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "key-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "",
    "",
    "..####",
    ".#....#",
    ".#.oo.######",
    ".#.oo.######",
    ".#....#..#.#",
    "..####...#.#",
  ],
};

export default icon;
