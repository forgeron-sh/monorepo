import type { PixelIcon } from "../types";

// Arrow up in a box: the box of `add-square` and the arrow of `circle-arrow-up-01` in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-up-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#.oooooo.#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
