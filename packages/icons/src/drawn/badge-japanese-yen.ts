import type { PixelIcon } from "../types";

// Badge japanese yen: the badge rosette with a yen sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "badge-japanese-yen",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..###..###",
    "..#.o..o.#",
    "..#..oo..#",
    ".#..oooo..#",
    ".#...oo...#",
    "..#.oooo.#",
    "..#..oo..#",
    "..###..###",
    ".....##",
  ],
};

export default icon;
