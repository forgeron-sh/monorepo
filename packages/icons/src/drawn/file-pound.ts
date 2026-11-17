import type { PixelIcon } from "../types";

// File with a pound sterling sign badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-pound",
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
    ".#......ooo",
    ".#.....o",
    ".#....oooo",
    ".#.....o",
    ".####.ooooo",
  ],
};

export default icon;
