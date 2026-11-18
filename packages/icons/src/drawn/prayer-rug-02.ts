import type { PixelIcon } from "../types";

// Prayer rug half rolled: the roll across the top, the pointed niche in the secondary tone, fringes at the foot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "prayer-rug-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    ".#........#",
    ".##########",
    "..#......#",
    "..#..oo..#",
    "..#.o..o.#",
    "..#.o..o.#",
    "..#.oooo.#",
    "..#......#",
    "..########",
    "..#.#..#.#",
  ],
};

export default icon;
