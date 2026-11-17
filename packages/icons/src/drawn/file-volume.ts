import type { PixelIcon } from "../types";

// File with a speaker badge and one sound wave.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-volume",
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
    ".#....ooo.o",
    ".#....ooo.o",
    ".#....ooo.o",
    ".####...o",
  ],
};

export default icon;
