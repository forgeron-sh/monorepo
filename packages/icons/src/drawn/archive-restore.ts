import type { PixelIcon } from "../types";

// Archive box with an up arrow in the secondary tone on its body.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "archive-restore",
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
    "..#.oooo.#",
    "..#..oo..#",
    "..#..oo..#",
    "..#..oo..#",
    "..########",
  ],
};

export default icon;
