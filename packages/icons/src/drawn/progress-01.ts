import type { PixelIcon } from "../types";

// Progress: a ring, its right half drawn solid in the secondary tone, the left half still dotted.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "progress-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#.ooo",
    ".........o",
    "..........o",
    ".#........o",
    "..........o",
    ".#........o",
    "..........o",
    ".#........o",
    "..#......o",
    "...#.#ooo",
  ],
};

export default icon;
