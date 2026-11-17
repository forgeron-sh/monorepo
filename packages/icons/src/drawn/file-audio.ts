import type { PixelIcon } from "../types";

// File with a music-note badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-audio",
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
    ".#......oo",
    ".#......o.o",
    ".#......o",
    ".#....ooo",
    ".####.ooo",
  ],
};

export default icon;
