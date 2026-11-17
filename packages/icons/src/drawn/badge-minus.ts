import type { PixelIcon } from "../types";

// Badge minus: the badge rosette with a minus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "badge-minus",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..###..###",
    "..#......#",
    "..#......#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    "..#......#",
    "..#......#",
    "..###..###",
    ".....##",
  ],
};

export default icon;
