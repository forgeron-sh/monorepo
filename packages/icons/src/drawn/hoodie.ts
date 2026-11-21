import type { PixelIcon } from "../types";

// Hoodie: the body of `shirt-01` under a hood, the front pocket in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hoodie",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    ".##......##",
    "#..........#",
    "###......###",
    "..#......#",
    "..#......#",
    "..#.oooo.#",
    "..#o....o#",
    "..#......#",
    "..########",
  ],
};

export default icon;
