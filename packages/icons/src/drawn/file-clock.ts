import type { PixelIcon } from "../types";

// File with a clock badge (the badge of calendar-clock).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-clock",
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
    ".#.....ooo",
    ".#....o.o.o",
    ".#....o.ooo",
    ".#....o...o",
    ".####..ooo",
  ],
};

export default icon;
