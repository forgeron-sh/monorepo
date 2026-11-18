import type { PixelIcon } from "../types";

// Medicine bottle: a solid cap, sloping shoulders, a cross on the bottle in the secondary tone (an outlined cap read as the shackle of `lock`).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "medicine-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....####",
    "..##....##",
    ".#........#",
    ".#...oo...#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#...oo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
