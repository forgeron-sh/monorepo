import type { PixelIcon } from "../types";

// Archive down: the archive box with a down arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "archive-arrow-down",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".##########",
    "..#......#",
    "..#..oo..#",
    "..#..oo..#",
    "..#..oo..#",
    "..#.oooo.#",
    "..#..oo..#",
    "..########",
  ],
};

export default icon;
