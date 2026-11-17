import type { PixelIcon } from "../types";

// File with a download arrow badge, built like `file-add`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-download",
  implemented: true,
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
    ".#......o",
    ".#......o",
    ".#....o.o.o",
    ".#.....ooo",
    ".####...o",
  ],
};

export default icon;
