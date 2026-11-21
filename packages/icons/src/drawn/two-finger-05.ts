import type { PixelIcon } from "../types";

// Two fingers pointing right: `two-finger-01` turned a quarter turn, cuff on the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "two-finger-05",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "....######",
    ".#.####",
    ".#.#######",
    ".#.####",
    ".#.#####",
    ".#.####",
    "....####",
  ],
};

export default icon;
