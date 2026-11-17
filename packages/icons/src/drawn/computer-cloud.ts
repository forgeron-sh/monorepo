import type { PixelIcon } from "../types";

// Monitor with a cloud on its screen, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "computer-cloud",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...ooo..#",
    ".#..ooooo.#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
