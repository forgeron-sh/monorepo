import type { PixelIcon } from "../types";

// Badge cent: the badge rosette with a cent sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "badge-cent",
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
    ".#..o.....#",
    ".#..o.....#",
    "..#..ooo.#",
    "..#...o..#",
    "..###..###",
    ".....##",
  ],
};

export default icon;
