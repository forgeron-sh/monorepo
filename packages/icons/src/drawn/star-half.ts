import type { PixelIcon } from "../types";

// Half star: the outline of `star`, its left half filled in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "star-half",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#o.#",
    "....#o.#",
    "####oo..####",
    ".#oooo....#",
    "..#ooo...#",
    "..#ooo...#",
    ".#ooo##...#",
    ".#oo#..#..#",
    ".###....###",
  ],
};

export default icon;
