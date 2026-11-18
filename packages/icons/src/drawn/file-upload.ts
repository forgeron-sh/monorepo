import type { PixelIcon } from "../types";

// File with an upload arrow badge, built like `file-add`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-upload",
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
    ".#.....ooo",
    ".#....o.o.o",
    ".#......o",
    ".####...o",
  ],
};

export default icon;
