import type { PixelIcon } from "../types";

// File with an exclamation mark inside, built like `file-unknown`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-exclamation-point",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    "..#...##",
    "..#...#.#",
    "..#...####",
    "..#..oo..#",
    "..#..oo..#",
    "..#..oo..#",
    "..#......#",
    "..#..oo..#",
    "..########",
  ],
};

export default icon;
