import type { PixelIcon } from "../types";

// Kaaba in perspective: a cube showing its front and side faces, the band in the secondary tone around both.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "kaaba-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#########",
    ".#.......##",
    "#########.#",
    "#.......#o#",
    "#ooooooo#.#",
    "#.......#.#",
    "#.......#.#",
    "#.......#.#",
    "#.......#.#",
    "#.......##",
    "#########",
  ],
};

export default icon;
