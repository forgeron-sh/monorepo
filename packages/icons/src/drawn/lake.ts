import type { PixelIcon } from "../types";

// Lake: two peaks over a shoreline and the water's waves in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lake",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "..#.#...#",
    ".#...#.#.#",
    "#.....#...#",
    "############",
    "",
    ".oo..oo..oo",
    "o..oo..oo..o",
    "",
    "..oo..oo..oo",
    ".o..oo..oo",
  ],
};

export default icon;
