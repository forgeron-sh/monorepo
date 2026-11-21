import type { PixelIcon } from "../types";

// Square speech bubble with an arrow pointing up and out in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-square-share",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#",
    "..#..#.oooo",
    "..#.#....oo",
    "..##....o.o",
    ".......o..o",
  ],
};

export default icon;
