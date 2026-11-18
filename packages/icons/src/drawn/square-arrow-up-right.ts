import type { PixelIcon } from "../types";

// Arrow pointing up and right in the box of `square-arrow-up-01`, the arrow of `arrow-up-right-01` at
// 6×6, centred, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-up-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oooo.#",
    ".#.....oo.#",
    ".#....o.o.#",
    ".#...o..o.#",
    ".#..o.....#",
    ".#.o......#",
    ".#........#",
    "..########",
  ],
};

export default icon;
