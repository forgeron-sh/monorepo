import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`check`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "checkmark-square-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "#########..o",
    "#.......#.oo",
    "#.......#oo.",
    "#.......oo..",
    "#o.....oo#..",
    "#oo...oo.#..",
    "#.oo.oo..#..",
    "#..ooo.#.#..",
    "#...o.#.##..",
    "#########...",
    ".#.#.#.#.#..",
    "",
  ],
};

export default icon;
