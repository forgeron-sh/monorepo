import type { PixelIcon } from "../types";

// File with an arrow entering through its left side, built like `folder-input`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-input",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    "..#...##",
    "..#...#.#",
    "..#...####",
    "....o....#",
    "oooooo...#",
    "....o....#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
