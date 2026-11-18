import type { PixelIcon } from "../types";

// The Python mark in pixels: the two interlocking snakes, the second one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "python",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#.####",
    "...######",
    ".########.o",
    "#########.oo",
    "########..oo",
    "##..oooooooo",
    "##.ooooooooo",
    ".#.oooooooo",
    "...oooooo",
    "...oooo.o",
    "....oooo",
  ],
};

export default icon;
