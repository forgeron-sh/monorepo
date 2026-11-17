import type { PixelIcon } from "../types";

// Flip horizontally: a solid triangle and its outlined mirror image across a dashed vertical axis.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flip-horizontal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "#....oo....#",
    "##........##",
    "###......#.#",
    "####.oo.#..#",
    "####.oo.#..#",
    "###......#.#",
    "##........##",
    "#....oo....#",
    ".....oo",
  ],
};

export default icon;
