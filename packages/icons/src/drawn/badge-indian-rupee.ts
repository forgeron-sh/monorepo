import type { PixelIcon } from "../types";

// Badge indian rupee: the badge rosette with an Indian rupee sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "badge-indian-rupee",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..###..###",
    "..#.oooo.#",
    "..#...o..#",
    ".#..oooo..#",
    ".#..oo....#",
    "..#..o...#",
    "..#...o..#",
    "..###..###",
    ".....##",
  ],
};

export default icon;
