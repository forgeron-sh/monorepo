import type { PixelIcon } from "../types";

// Golf club: a shaft on the diagonal ending in a solid head, a ball beside it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "golf-bat",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........#",
    ".........#",
    "........#",
    ".......#",
    "......#",
    ".....#",
    "....#",
    "...#",
    "####....oo",
    "###.....oo",
  ],
};

export default icon;
