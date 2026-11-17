import type { PixelIcon } from "../types";

// Badge dollar: the badge rosette with a dollar sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "badge-dollar-sign",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..###..###",
    "..#...o..#",
    "..#..ooo.#",
    ".#..oo....#",
    ".#....oo..#",
    "..#.ooo..#",
    "..#..o...#",
    "..###..###",
    ".....##",
  ],
};

export default icon;
