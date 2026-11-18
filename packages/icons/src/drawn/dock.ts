import type { PixelIcon } from "../types";

// Dock: a screen outline with the bar of apps along its bottom in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dock",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
