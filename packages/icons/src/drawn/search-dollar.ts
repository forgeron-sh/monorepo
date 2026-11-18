import type { PixelIcon } from "../types";

// Search money: the lens of `search-add` with a narrow dollar sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "search-dollar",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...###",
    ".##.o.##",
    ".#.ooo.#",
    "#..o....#",
    "#..ooo..#",
    "#....o..#",
    ".#.ooo.#",
    ".##.o.##",
    "...###.##",
    "........##",
    ".........##",
  ],
};

export default icon;
