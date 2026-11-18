import type { PixelIcon } from "../types";

// File with a minus badge, built like `file-add`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-remove",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...##",
    ".#...#.#",
    ".#...####",
    ".#",
    ".#",
    ".#",
    ".#....ooooo",
    ".#",
    ".####",
  ],
};

export default icon;
