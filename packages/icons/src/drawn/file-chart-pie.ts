import type { PixelIcon } from "../types";

// File with a pie chart badge, its upper-right slice cut out.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-chart-pie",
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
    ".#.....oo",
    ".#....ooo",
    ".#....ooooo",
    ".#....ooooo",
    ".####..ooo",
  ],
};

export default icon;
