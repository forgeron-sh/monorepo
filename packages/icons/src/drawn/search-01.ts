import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`search`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "search-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
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
