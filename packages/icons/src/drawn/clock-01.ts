import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`clock`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "clock-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...o....#",
    ".#...o....#",
    ".#...o....#",
    ".#...oooo.#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
