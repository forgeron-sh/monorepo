import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`search`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "search-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "",
    "..####",
    ".#....#",
    "#..##..#",
    "#.#....#",
    "#......#",
    ".#....#",
    "..####oo",
    "......ooo",
    ".......ooo",
    "........oo",
  ],
};

export default icon;
