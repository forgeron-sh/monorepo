import type { PixelIcon } from "../types";

// Badge plus: the badge rosette with a plus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "badge-plus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..###..###",
    "..#..oo..#",
    "..#..oo..#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    "..#..oo..#",
    "..#..oo..#",
    "..###..###",
    ".....##",
  ],
};

export default icon;
